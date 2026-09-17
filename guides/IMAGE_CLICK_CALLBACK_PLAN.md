# Optional image click callback plan

## Summary

Add an optional `onImageClick` callback to `LazyImageGallery`. Forward clicks on a successfully loaded source image with its normalized image data, item and image indexes, and click event. The consumer owns the response, such as opening a detail view. Do not add a button or any default click action.

This document is a plan only. No runtime, type, test, or documentation changes are implemented here.

## Current behavior

`LazyImageGallery` exposes `onImageLoad` and `onImageError`, but no click callback. Each tile renders the source image, optional placeholder and fallback images, and a Retry button for errors. The source image is not an interactive control.

## Proposed public contract

- Add an optional `onImageClick` prop to `LazyImageGalleryProps`. The same prop is available through `mountLazyImageGallery()` because its props use that interface.
- Pass a dedicated context containing `image: NormalizedGalleryImage`, `itemIndex`, and `imageIndex`, plus the React mouse event for the source `HTMLImageElement`. Do not reuse load/error-only `attempt` or `stage` fields for this click contract.
- Export the context type from the package root alongside the existing public types.
- Invoke the callback only for a click on the final source image while that image is in the `loaded` state. Do not invoke it for idle or loading tiles, placeholders, fallback images, error feedback, or Retry.
- Leave click propagation to the consumer. Do not open a dialog, navigate, dispatch a custom event, or catch and suppress consumer callback errors.
- When `onImageClick` is absent, preserve the existing markup, layout, styling, focus behavior, and image state flow. Do not add a button, role, `tabIndex`, keyboard handler, pointer cursor, or global event listener.

## Implementation scope after approval

1. Add the prop and context type in `src/types.ts`, then export the type through `src/index.ts`.
2. Pass the callback through `LazyImageGallery` to each tile in `src/LazyImageGallery.tsx`. Bind it only to the source image and gate invocation on the loaded state.
3. Document the callback, context, loaded-only behavior, and consumer-owned accessibility in `README.md`. Keep the package independent of `layer-esm` and any other dialog implementation.
4. Add focused tests in `test/gallery.test.tsx` for the callback contract and unchanged default behavior. Keep server-rendering and mount-controller coverage aligned with the new optional prop.
5. Build and inspect the generated declarations and both package formats through the repository's owning build command. Do not edit generated `lib/`, `dist-dev/`, or `docs/` files by hand.

## Accessibility and edge cases

- `onImageClick` is a pointer-click hook, not an accessible activation control. An image does not become keyboard-focusable merely because it has a click handler. Consumers that offer an image-opening action must provide their own keyboard-operable, visibly focusable control and meaningful accessible name.
- The configured `image.width` and `image.height` are optional metadata, not guaranteed loaded dimensions. With responsive `srcSet`, the actual selected resource may differ from `image.src`; the click event's source element is available to the consumer during the callback.
- A source change or Retry can replace the image element. The callback must report the current normalized image and indexes after rerender, without firing for an earlier loading or error state.
- Existing placeholder, fallback, error, Retry, lazy-loading, and observer behavior must remain unchanged.

## Verification after implementation

- Confirm no callback fires before source load, after source error, or from placeholder, fallback, or Retry interactions.
- Confirm a loaded source click invokes the callback once with the expected normalized image, item/image indexes, and source-image click event. Confirm it still works after prop updates and Retry succeeds.
- Confirm omission of `onImageClick` leaves the gallery's DOM and interaction behavior unchanged, and server rendering remains safe.
- Confirm `mountLazyImageGallery()` accepts the callback and `update()` can replace it without retaining an obsolete handler.
- Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, `npm run preview`, and `npm pack --dry-run`. Inspect the CommonJS and ESM exports, generated declarations, package contents, final diff, and `git diff --check`.

## Risks and alternatives

- Click-only interaction is insufficient for keyboard users. This is an explicit consumer responsibility, not a reason to silently add button semantics in the library.
- A consumer can listen for bubbled DOM clicks without a new prop, but selecting the correct image currently depends on internal markup or URL matching. A typed callback is a more stable public boundary.
- A render prop or general image-attribute hook would offer broader control but expands the API and could interfere with the library's loading and retry ownership. Do not add one for this narrow requirement.
