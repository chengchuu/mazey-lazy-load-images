import { StrictMode, act } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { LazyImageGallery, mountLazyImageGallery } from "../src";
import { DEFAULT_STYLES } from "../src/styles";
import type {
  GalleryItem,
  ImageEventContext,
  LazyImageGalleryController,
} from "../src";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds = [0];
  readonly observed = new Set<Element>();
  readonly options?: IntersectionObserverInit;
  disconnected = false;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.options = options;
    this.rootMargin = options?.rootMargin ?? "0px";
    MockIntersectionObserver.instances.push(this);
  }

  observe = jest.fn((element: Element) => {
    this.observed.add(element);
  });

  unobserve = jest.fn((element: Element) => {
    this.observed.delete(element);
  });

  disconnect = jest.fn(() => {
    this.disconnected = true;
    this.observed.clear();
  });

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  intersect(element: Element, isIntersecting = true): void {
    this.callback(
      [
        {
          target: element,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
}

const items: GalleryItem[] = [
  {
    id: "first",
    title: "First collection",
    description: "A descriptive collection.",
    images: [
      "https://example.com/decorative.jpg",
      {
        id: "portrait",
        src: "https://example.com/portrait.jpg",
        alt: "Portrait example",
        width: 400,
        height: 600,
        srcSet: "https://example.com/portrait-800.jpg 800w",
        sizes: "(min-width: 800px) 33vw, 100vw",
        placeholderSrc: "https://example.com/placeholder.jpg",
        fallbackSrc: "https://example.com/fallback.jpg",
        fetchPriority: "low",
      },
    ],
  },
];

function latestObserver(): MockIntersectionObserver {
  const observer = MockIntersectionObserver.instances.at(-1);
  if (!observer) {
    throw new Error("Expected an IntersectionObserver instance.");
  }
  return observer;
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver,
  });
});

afterEach(() => {
  cleanup();
});

test("keeps feedback backgrounds while loaded tiles are transparent", () => {
  expect(DEFAULT_STYLES).toMatch(
    /\.mlli-tile \{[^}]*background: var\(--mlli-background\);[^}]*\}/,
  );
  expect(DEFAULT_STYLES).toMatch(
    /\.mlli-tile\[data-status='loaded'\] \{\s*background: transparent;\s*\}/,
  );
});

test("renders ordered sections and normalizes string and object images", () => {
  const { container } = render(<LazyImageGallery items={items} />);

  expect(
    screen.getByRole("heading", { name: "First collection" }),
  ).toBeTruthy();
  expect(screen.getByText("A descriptive collection.")).toBeTruthy();

  const images = [...container.querySelectorAll(".mlli-image")];
  expect(images).toHaveLength(2);
  expect(images[0].getAttribute("alt")).toBe("");
  expect(images[0].getAttribute("src")).toBeNull();
  expect(images[1].getAttribute("alt")).toBe("Portrait example");
  expect(images[1].getAttribute("width")).toBe("400");
  expect(images[1].getAttribute("height")).toBe("600");
  expect(images[1].getAttribute("loading")).toBe("lazy");
  expect(images[1].getAttribute("decoding")).toBe("async");
  expect(
    container.querySelector(".mlli-root")?.getAttribute("style"),
  ).toContain("--mlli-column-width: 240px");
  expect(latestObserver().options).toEqual({ rootMargin: "300px 0px" });
});

test("renders empty collections, duplicate sources, and text content safely", () => {
  const unsafeText = '<img src="x" onerror="alert(1)">';
  const { container, rerender } = render(
    <LazyImageGallery
      items={[
        {
          title: unsafeText,
          description: unsafeText,
          images: [
            "https://example.com/duplicate.jpg",
            "https://example.com/duplicate.jpg",
          ],
        },
      ]}
    />,
  );

  expect(screen.getAllByText(unsafeText)).toHaveLength(2);
  expect(container.querySelectorAll(".mlli-image")).toHaveLength(2);
  expect(container.querySelector('img[src="x"]')).toBeNull();

  rerender(<LazyImageGallery items={[]} />);
  expect(container.querySelectorAll(".mlli-section")).toHaveLength(0);
});

test("omits invalid dimensions and falls back to a finite aspect ratio", () => {
  const { container } = render(
    <LazyImageGallery
      items={[
        {
          title: "Invalid dimensions",
          images: [
            {
              src: "https://example.com/invalid-dimensions.jpg",
              width: -1,
              height: Number.POSITIVE_INFINITY,
            },
          ],
        },
      ]}
      defaultAspectRatio={Number.NaN}
    />,
  );

  const image = container.querySelector(".mlli-image")!;
  const tile = container.querySelector<HTMLElement>(".mlli-tile")!;
  expect(image.getAttribute("width")).toBeNull();
  expect(image.getAttribute("height")).toBeNull();
  expect(tile.style.aspectRatio).toBe(String(4 / 3));
});

test("reports an empty source as an error without assigning it", () => {
  const onImageError = jest.fn<void, [ImageEventContext]>();
  const { container } = render(
    <LazyImageGallery
      items={[{ title: "Empty source", images: ["   "] }]}
      onImageError={onImageError}
    />,
  );
  const tile = container.querySelector(".mlli-tile")!;

  act(() => latestObserver().intersect(tile));

  expect(tile.getAttribute("data-status")).toBe("error");
  expect(tile.querySelector(".mlli-image")?.getAttribute("src")).toBeNull();
  expect(screen.getByText("Image failed to load")).toBeTruthy();
  expect(onImageError).toHaveBeenCalledWith(
    expect.objectContaining({ attempt: 1, stage: "source" }),
  );

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(onImageError).toHaveBeenLastCalledWith(
    expect.objectContaining({ attempt: 2, stage: "source" }),
  );
});

test("reveals only intersecting images and reports successful loads", () => {
  const onImageLoad = jest.fn<void, [ImageEventContext]>();
  const { container } = render(
    <LazyImageGallery items={items} onImageLoad={onImageLoad} />,
  );
  const tiles = [...container.querySelectorAll(".mlli-tile")];
  const images = [
    ...container.querySelectorAll<HTMLImageElement>(".mlli-image"),
  ];
  const observer = latestObserver();

  act(() => observer.intersect(tiles[1]));

  expect(images[0].getAttribute("src")).toBeNull();
  expect(images[1].src).toBe("https://example.com/portrait.jpg");
  expect(images[1].srcset).toBe("https://example.com/portrait-800.jpg 800w");
  expect(images[1].sizes).toBe("(min-width: 800px) 33vw, 100vw");
  expect(observer.unobserve).toHaveBeenCalledWith(tiles[1]);

  fireEvent.load(images[1]);
  expect(tiles[1].getAttribute("data-status")).toBe("loaded");
  expect(onImageLoad).toHaveBeenCalledWith(
    expect.objectContaining({
      itemIndex: 0,
      imageIndex: 1,
      attempt: 1,
      stage: "source",
      image: expect.objectContaining({
        src: "https://example.com/portrait.jpg",
        alt: "Portrait example",
      }),
    }),
  );
});

test("shows placeholder, failure feedback, fallback, and manual retry", () => {
  const onImageError = jest.fn<void, [ImageEventContext]>();
  const { container } = render(
    <LazyImageGallery
      items={items}
      labels={{ error: "Unavailable", retry: "Load again" }}
      onImageError={onImageError}
    />,
  );
  const tile = container.querySelectorAll(".mlli-tile")[1];
  const observer = latestObserver();

  act(() => observer.intersect(tile));
  const placeholder = tile.querySelector<HTMLImageElement>(".mlli-placeholder");
  expect(placeholder?.src).toBe("https://example.com/placeholder.jpg");
  fireEvent.load(placeholder!);
  expect(placeholder?.getAttribute("data-visible")).toBe("true");

  let source = tile.querySelector<HTMLImageElement>(".mlli-image")!;
  fireEvent.error(source);
  expect(screen.getByText("Unavailable")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Load again" })).toBeTruthy();
  const fallbackImage = tile.querySelector<HTMLImageElement>(".mlli-fallback")!;
  expect(fallbackImage.src).toBe("https://example.com/fallback.jpg");

  fireEvent.error(fallbackImage);
  expect(tile.querySelector(".mlli-fallback")).toBeNull();
  expect(onImageError).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ attempt: 1, stage: "source" }),
  );
  expect(onImageError).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ attempt: 1, stage: "fallback" }),
  );

  fireEvent.click(screen.getByRole("button", { name: "Load again" }));
  source = tile.querySelector<HTMLImageElement>(".mlli-image")!;
  expect(source.src).toBe("https://example.com/portrait.jpg");
  expect(tile.getAttribute("data-status")).toBe("loading");
  fireEvent.error(source);
  expect(onImageError).toHaveBeenLastCalledWith(
    expect.objectContaining({ attempt: 2, stage: "source" }),
  );
});

test("uses gallery-level placeholder and fallback defaults", () => {
  const { container } = render(
    <LazyImageGallery
      items={[{ title: "Defaults", images: ["https://example.com/a.jpg"] }]}
      defaultPlaceholderSrc="https://example.com/default-placeholder.jpg"
      defaultFallbackSrc="https://example.com/default-fallback.jpg"
    />,
  );
  const tile = container.querySelector(".mlli-tile")!;

  act(() => latestObserver().intersect(tile));
  expect(tile.querySelector<HTMLImageElement>(".mlli-placeholder")?.src).toBe(
    "https://example.com/default-placeholder.jpg",
  );
  fireEvent.error(tile.querySelector(".mlli-image")!);
  expect(tile.querySelector<HTMLImageElement>(".mlli-fallback")?.src).toBe(
    "https://example.com/default-fallback.jpg",
  );
});

test("preserves default labels when partial values are undefined", () => {
  const { container } = render(
    <LazyImageGallery
      items={[{ title: "Default labels", images: [""] }]}
      labels={{ loading: undefined, error: undefined, retry: undefined }}
    />,
  );
  const tile = container.querySelector(".mlli-tile")!;
  expect(screen.getByText("Loading image")).toBeTruthy();

  act(() => latestObserver().intersect(tile));

  expect(screen.getByText("Image failed to load")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
});

test("loads all image sources when IntersectionObserver is unavailable", () => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: undefined,
  });
  const { container } = render(<LazyImageGallery items={items} />);

  const images = [
    ...container.querySelectorAll<HTMLImageElement>(".mlli-image"),
  ];
  expect(images[0].src).toBe("https://example.com/decorative.jpg");
  expect(images[1].src).toBe("https://example.com/portrait.jpg");
});

test("loads images added later when IntersectionObserver is unavailable", () => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: undefined,
  });
  const { container, rerender } = render(<LazyImageGallery items={[]} />);

  rerender(
    <LazyImageGallery
      items={[
        {
          title: "Added collection",
          images: ["https://example.com/added.jpg"],
        },
      ]}
    />,
  );

  expect(container.querySelector<HTMLImageElement>(".mlli-image")?.src).toBe(
    "https://example.com/added.jpg",
  );
});

test("does not reload a loaded source when feedback defaults change", () => {
  const { container, rerender } = render(
    <LazyImageGallery
      items={[
        {
          id: "stable-item",
          title: "Stable source",
          images: [
            {
              id: "stable-image",
              src: "https://example.com/stable.jpg",
            },
          ],
        },
      ]}
      defaultPlaceholderSrc="https://example.com/placeholder-one.jpg"
      defaultFallbackSrc="https://example.com/fallback-one.jpg"
    />,
  );
  const tile = container.querySelector(".mlli-tile")!;
  act(() => latestObserver().intersect(tile));
  const source = tile.querySelector<HTMLImageElement>(".mlli-image")!;
  fireEvent.load(source);

  rerender(
    <LazyImageGallery
      items={[
        {
          id: "stable-item",
          title: "Stable source",
          images: [
            {
              id: "stable-image",
              src: "https://example.com/stable.jpg",
            },
          ],
        },
      ]}
      defaultPlaceholderSrc="https://example.com/placeholder-two.jpg"
      defaultFallbackSrc="https://example.com/fallback-two.jpg"
    />,
  );

  expect(tile.getAttribute("data-status")).toBe("loaded");
  expect(tile.querySelector(".mlli-image")).toBe(source);
  expect(source.src).toBe("https://example.com/stable.jpg");
});

test("keeps gallery observers isolated and cleans up in Strict Mode", () => {
  const first = render(
    <StrictMode>
      <LazyImageGallery items={items} />
    </StrictMode>,
  );
  const second = render(<LazyImageGallery items={items} />);
  const activeObservers = MockIntersectionObserver.instances.filter(
    (observer) => !observer.disconnected,
  );

  expect(activeObservers).toHaveLength(2);
  expect(activeObservers[0].observed.size).toBe(2);
  expect(activeObservers[1].observed.size).toBe(2);

  first.unmount();
  expect(activeObservers[0].disconnect).toHaveBeenCalled();
  expect(activeObservers[1].disconnect).not.toHaveBeenCalled();
  second.unmount();
  expect(activeObservers[1].disconnect).toHaveBeenCalled();
});

test("updates an image source with a stable image id and observes it again", () => {
  const originalItems: GalleryItem[] = [
    {
      id: "stable-item",
      title: "Stable item",
      images: [{ id: "stable-image", src: "https://example.com/old.jpg" }],
    },
  ];
  const { container, rerender } = render(
    <LazyImageGallery items={originalItems} />,
  );
  const firstTile = container.querySelector(".mlli-tile")!;
  act(() => latestObserver().intersect(firstTile));
  expect(container.querySelector<HTMLImageElement>(".mlli-image")?.src).toBe(
    "https://example.com/old.jpg",
  );

  rerender(
    <LazyImageGallery
      items={[
        {
          id: "stable-item",
          title: "Stable item",
          images: [{ id: "stable-image", src: "https://example.com/new.jpg" }],
        },
      ]}
    />,
  );
  const nextImage = container.querySelector<HTMLImageElement>(".mlli-image")!;
  const nextTile = container.querySelector(".mlli-tile")!;
  expect(nextImage.getAttribute("src")).toBeNull();
  act(() => latestObserver().intersect(nextTile));
  expect(nextImage.src).toBe("https://example.com/new.jpg");
});

test("re-observes a stable image when its responsive source changes", () => {
  const createResponsiveItems = (srcSet: string): GalleryItem[] => [
    {
      id: "responsive-item",
      title: "Responsive item",
      images: [
        {
          id: "responsive-image",
          src: "https://example.com/responsive.jpg",
          srcSet,
          sizes: "100vw",
        },
      ],
    },
  ];
  const { container, rerender } = render(
    <LazyImageGallery
      items={createResponsiveItems("https://example.com/old-800.jpg 800w")}
    />,
  );
  const firstTile = container.querySelector(".mlli-tile")!;
  act(() => latestObserver().intersect(firstTile));
  fireEvent.load(container.querySelector(".mlli-image")!);

  rerender(
    <LazyImageGallery
      items={createResponsiveItems("https://example.com/new-1200.jpg 1200w")}
    />,
  );

  const nextTile = container.querySelector(".mlli-tile")!;
  const nextImage = container.querySelector<HTMLImageElement>(".mlli-image")!;
  expect(nextTile).not.toBe(firstTile);
  expect(nextImage.getAttribute("src")).toBeNull();
  act(() => latestObserver().intersect(nextTile));
  expect(nextImage.srcset).toBe("https://example.com/new-1200.jpg 1200w");
});

test("mount API validates targets, updates props, and destroys idempotently", () => {
  const target = document.createElement("div");
  target.id = "mounted-gallery";
  document.body.appendChild(target);
  let controller: LazyImageGalleryController;

  act(() => {
    controller = mountLazyImageGallery("#mounted-gallery", {
      items: [{ title: "Mounted title", images: [] }],
    });
  });
  expect(screen.getByRole("heading", { name: "Mounted title" })).toBeTruthy();

  act(() => {
    controller.update({
      items: [{ title: "Updated title", images: [] }],
    });
  });
  expect(screen.getByRole("heading", { name: "Updated title" })).toBeTruthy();

  act(() => controller.destroy());
  act(() => controller.destroy());
  expect(target.childElementCount).toBe(0);
  expect(() => controller.update({ items: [] })).toThrow(
    "cannot update a destroyed gallery",
  );
  target.remove();

  expect(() => mountLazyImageGallery("", { items: [] })).toThrow(
    "selector must not be empty",
  );
  expect(() => mountLazyImageGallery("[", { items: [] })).toThrow(
    "received an invalid selector",
  );
  expect(() => mountLazyImageGallery("#missing", { items: [] })).toThrow(
    "could not find a target",
  );
});

test("omits default styles when unstyled is enabled", () => {
  render(<LazyImageGallery items={[]} unstyled />);
  expect(
    document.head.querySelector(
      'style[href="mazey-lazy-load-images-default-styles-v2"]',
    ),
  ).toBeNull();
});
