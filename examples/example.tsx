import type {
  GalleryItem,
  LazyImageGalleryController,
  LazyImageGalleryProps,
} from "../src";
import { mountLazyImageGallery } from "../src";

const placeholder =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24"%3E%3Crect width="100%25" height="100%25" fill="%23dbeafe"/%3E%3C/svg%3E';
const fallback =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="480"%3E%3Crect width="100%25" height="100%25" fill="%23fee2e2"/%3E%3Cpath d="M220 300l70-80 55 60 40-45 75 85H180z" fill="%23b91c1c"/%3E%3C/svg%3E';

function createItems(sectionCount = 3, imagesPerSection = 80): GalleryItem[] {
  return Array.from({ length: sectionCount }, (_section, sectionIndex) => ({
    id: `section-${sectionIndex}`,
    title: `Collection ${sectionIndex + 1}`,
    description: `A responsive waterfall containing ${imagesPerSection} lazy-loaded images.`,
    images: Array.from({ length: imagesPerSection }, (_image, imageIndex) => {
      const id = sectionIndex * imagesPerSection + imageIndex;
      const width = 480 + (id % 4) * 80;
      const height = 320 + (id % 5) * 100;
      const src =
        imageIndex === imagesPerSection - 1
          ? `https://example.invalid/broken-${sectionIndex}.jpg`
          : `https://picsum.photos/seed/mlli-${id}/${width}/${height}`;

      if (imageIndex % 5 === 0) {
        return src;
      }

      return {
        id: `image-${id}`,
        src,
        alt: `Generated gallery example ${id + 1}`,
        width,
        height,
      };
    }),
  }));
}

const galleryElement = document.querySelector("#gallery");
const statusElement = document.querySelector("#event-status");
const initialItems = createItems();
let controller: LazyImageGalleryController | undefined;
let loadCount = 0;
let errorCount = 0;

function setStatus(): void {
  if (statusElement) {
    statusElement.textContent = `${loadCount} loaded, ${errorCount} failed`;
  }
}

function createGalleryProps(items: GalleryItem[]): LazyImageGalleryProps {
  return {
    items,
    minColumnWidth: "220px",
    defaultPlaceholderSrc: placeholder,
    defaultFallbackSrc: fallback,
    onImageLoad: ({ stage }) => {
      if (stage === "source") {
        loadCount += 1;
        setStatus();
      }
    },
    onImageError: ({ stage }) => {
      if (stage === "source") {
        errorCount += 1;
        setStatus();
      }
    },
  };
}

function mount(items: GalleryItem[]): void {
  if (!galleryElement) {
    throw new Error("The gallery example target is missing.");
  }

  controller = mountLazyImageGallery(galleryElement, createGalleryProps(items));
}

mount(initialItems);
setStatus();

document.querySelector("#show-small")?.addEventListener("click", () => {
  controller?.update(createGalleryProps(createItems(1, 12)));
});

document.querySelector("#show-all")?.addEventListener("click", () => {
  controller?.update(createGalleryProps(initialItems));
});

document.querySelector("#destroy")?.addEventListener("click", () => {
  controller?.destroy();
  controller = undefined;
});

document.querySelector("#remount")?.addEventListener("click", () => {
  if (!controller) {
    mount(initialItems);
  }
});
