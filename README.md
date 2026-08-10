# mazey-lazy-load-images

[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]

[npm-image]: https://img.shields.io/npm/v/mazey-lazy-load-images
[npm-url]: https://www.npmjs.com/package/mazey-lazy-load-images
[license-image]: https://img.shields.io/npm/l/mazey-lazy-load-images
[license-url]: https://github.com/chengchuu/mazey-lazy-load-images/blob/main/LICENSE

Render responsive, lazy-loaded image collections with React 19. Each collection item contains a title, an optional description, and a CSS-column waterfall of images.

The package renders lightweight placeholders for the complete collection and requests each image when it approaches the viewport. It supports CSS skeletons, optional blurred placeholders, visible failure feedback, fallback images, and manual retries.

## Install

Install the package and its React 19 peer dependencies:

```bash
npm install mazey-lazy-load-images react@^19 react-dom@^19
```

## Use the React component

```tsx
import { LazyImageGallery } from "mazey-lazy-load-images";
import type { GalleryItem } from "mazey-lazy-load-images";

const items: GalleryItem[] = [
  {
    id: "travel",
    title: "Travel notes",
    description: "Images from the latest trip.",
    images: [
      "https://example.com/decorative.jpg",
      {
        id: "harbor",
        src: "https://example.com/harbor.jpg",
        alt: "Boats in the harbor at sunset",
        width: 1200,
        height: 800,
        placeholderSrc: "https://example.com/harbor-placeholder.jpg",
        fallbackSrc: "https://example.com/image-unavailable.jpg",
      },
    ],
  },
];

export function Gallery() {
  return (
    <LazyImageGallery
      items={items}
      minColumnWidth="260px"
      gap="20px"
      onImageError={({ image, attempt, stage }) => {
        console.error(image.src, attempt, stage);
      }}
    />
  );
}
```

A string image URL is treated as decorative and receives `alt=""`. Use an image object with `alt` for informative images. Provide `width` and `height` when possible so the gallery can reserve the correct aspect ratio before the image loads.

## Mount into a browser page

Use `mountLazyImageGallery()` when the caller does not own a React root:

```ts
import { mountLazyImageGallery } from "mazey-lazy-load-images";

const galleryProps = {
  items,
  defaultPlaceholderSrc: "/images/loading-preview.jpg",
  defaultFallbackSrc: "/images/unavailable.jpg",
};

const gallery = mountLazyImageGallery("#gallery", galleryProps);

gallery.update({
  ...galleryProps,
  items: nextItems,
});

gallery.destroy();
```

The mount function accepts an `Element` or CSS selector. It throws when the selector is empty, invalid, or unmatched. `update()` replaces the complete gallery prop object, so include any callbacks and nondefault options that must remain active. `destroy()` is idempotent. Calling `update()` after destruction throws an error.

For a bundler-free browser page, provide React 19 through an import map and load the package as an ES module:

```html
<div id="gallery"></div>

<script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@19.2.8",
      "react/jsx-runtime": "https://esm.sh/react@19.2.8/jsx-runtime",
      "react-dom": "https://esm.sh/react-dom@19.2.8?external=react",
      "react-dom/client": "https://esm.sh/react-dom@19.2.8/client?external=react",
      "mazey-lazy-load-images": "https://esm.sh/mazey-lazy-load-images@2?external=react,react-dom"
    }
  }
</script>

<script type="module">
  import { mountLazyImageGallery } from "mazey-lazy-load-images";

  mountLazyImageGallery("#gallery", {
    items: [
      {
        title: "Browser example",
        images: ["https://example.com/image.jpg"],
      },
    ],
  });
</script>
```

## Configure images

Each `images` entry accepts a URL string or an object with these fields:

- `src`: Final image URL. Required for object entries.
- `alt`: Alternative text. Defaults to an empty string.
- `id`: Stable key for updates and reordering.
- `width` and `height`: Intrinsic dimensions used to reserve space.
- `srcSet` and `sizes`: Responsive image attributes.
- `placeholderSrc`: Optional blurred image shown during the final request.
- `fallbackSrc`: Optional image shown behind the failure message.
- `fetchPriority`: Browser fetch priority: `high`, `low`, or `auto`.

Gallery-level `defaultPlaceholderSrc` and `defaultFallbackSrc` values apply when an image does not define its own value. Keep placeholder files small because they are separate image requests.

## Configure loading behavior

`LazyImageGallery` accepts these behavior and presentation props:

- `rootMargin`: Intersection Observer preload margin. Defaults to `300px 0px`.
- `minColumnWidth`: Preferred CSS column width. Defaults to `240px`.
- `gap`: Space between image tiles. Defaults to `16px`.
- `defaultAspectRatio`: Reserved ratio when dimensions are absent. Defaults to `4 / 3`.
- `labels`: Overrides the `loading`, `error`, and `retry` text.
- `className` and `style`: Extend the gallery root.
- `unstyled`: Omits the built-in stylesheet.
- `onImageLoad` and `onImageError`: Receive the normalized image, item and image indexes, request attempt, and `source` or `fallback` stage.

The component creates one `IntersectionObserver` per gallery. When Intersection Observer is unavailable, it assigns all final image sources immediately and retains native `loading="lazy"` behavior.

## Customize styles

The React 19 component inserts and deduplicates its namespaced stylesheet. Set `unstyled` to `true` to provide all styles yourself.

Override the built-in CSS custom properties from `className` or `style`:

```css
.photo-library {
  --mlli-column-width: 280px;
  --mlli-gap: 24px;
  --mlli-radius: 12px;
  --mlli-background: #e2e8f0;
  --mlli-foreground: #0f172a;
  --mlli-muted: #475569;
  --mlli-error-background: #fff1f2;
  --mlli-error-foreground: #9f1239;
  --mlli-button-background: #0f172a;
  --mlli-button-foreground: #ffffff;
}
```

The built-in animation respects `prefers-reduced-motion`.

## Server rendering

`LazyImageGallery` does not access browser globals during module import or server rendering. Server output contains the collection structure, reserved tiles, and default stylesheet. Image observation and source assignment begin after the component mounts in a browser.

`mountLazyImageGallery()` is browser-only and throws when no browser document is available.

## Migrate from v1

Version 2 removes `lazyLoadImages({ images, container, defaultImg })`. Replace the old group fields and imperative call:

```ts
lazyLoadImages({
  images: [{ name: "Example", img: ["/one.jpg"] }],
  container: "#gallery",
  defaultImg: "/placeholder.jpg",
});
```

with the v2 mount API:

```ts
mountLazyImageGallery("#gallery", {
  items: [
    {
      title: "Example",
      images: ["/one.jpg"],
    },
  ],
  defaultPlaceholderSrc: "/placeholder.jpg",
});
```

Version 2 also removes Mazey, global scroll and resize listeners, document-wide image queries, `innerHTML` rendering, and the Boolean initialization result. Keep the returned controller and call `destroy()` when another system removes the mounted page region.

## Browser support

The package targets current Chrome, Edge, Firefox, and Safari releases. CSS multi-columns provide the waterfall layout. Browsers without Intersection Observer load the collection through the native image loading behavior.

The package does not fetch item data, paginate collections, implement infinite scrolling, or virtualize the DOM.

## Contribute

Development requires Node.js 22 and pnpm 10.26.2.

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
pnpm run docs
```

Run the complete local verification pipeline with:

```bash
pnpm run preview
pnpm pack --dry-run
```
