# Repository Guide

## Scope and public contract

This repository publishes the React 19-based `mazey-lazy-load-images` package. It renders ordered collection sections containing titles, descriptions, and responsive CSS-column image waterfalls.

The public root exports:

- `LazyImageGallery`: SSR-safe React component for an existing React tree.
- `mountLazyImageGallery`: browser-only mounting helper that owns one React root.
- Public item, image, event, prop, and controller types.

Version 2 is a clean break from `lazyLoadImages({ images, container, defaultImg })`. Do not restore the v1 adapter unless the user explicitly requests another compatibility release.

Keep package exports, implementation, declarations, README examples, tests, and generated bundles aligned whenever the public contract changes.

## Repository map and generated boundaries

- `src/index.ts`: supported package-root exports.
- `src/LazyImageGallery.tsx`: collection rendering, image state, one-observer-per-gallery ownership, and cleanup.
- `src/mountLazyImageGallery.tsx`: target validation and imperative React root controller.
- `src/types.ts`: public TypeScript contract.
- `src/styles.ts`: React 19 inline stylesheet source. It is runtime source, not generated CSS.
- `examples/example.tsx` and `examples/example.html`: Webpack development consumer with 240 mixed images, failure feedback, update, destroy, and remount controls.
- `test/`: Jest, jsdom, React Testing Library, SSR, packaging, and toolchain tests.
- `rollup.config.mjs`: CommonJS, ES module, and declaration builds under `lib/`.
- `webpack.config.js`: development example build under `dist/`.
- `docs/`, `lib/`, and `dist/`: generated, ignored output. Never edit these directories by hand.
- `.github/workflows/`: validation and npm publication automation. Do not publish, tag, or push during local verification.

Use Node.js 22 and pnpm 10.26.2, as declared by `.nvmrc`, `engines`, and `packageManager`. `pnpm-lock.yaml` is the dependency authority.

## Runtime boundaries

React and React DOM are peer dependencies and Rollup externals. Keep them in `devDependencies` for local builds and tests, but never bundle them into the published package.

The package intentionally has no ordinary runtime dependencies. Version 2 removed Mazey because React lifecycle cleanup and the native Intersection Observer API replace the old throttling and style-insertion helpers.

Keep module imports SSR-safe. Do not access `window`, `document`, `Image`, `Element`, or `IntersectionObserver` at module scope or during component render. Browser behavior belongs in effects or the explicitly browser-only mount call.

The browser mount controller owns its React root:

```text
mountLazyImageGallery(target, props)
├── createRoot(target)
├── update(nextProps) -> root.render(...)
└── destroy() -> root.unmount()
```

`destroy()` is idempotent. `update()` after destruction throws. Target selectors throw descriptive errors when empty, invalid, or unmatched.

## Rendering and loading behavior

Render items as ordered semantic sections. Keep each title and description outside that item's image waterfall. Do not flatten images across items.

Use CSS multi-columns with `break-inside: avoid`; do not replace them with experimental native masonry without an explicit browser-compatibility decision. CSS columns fill top-to-bottom before moving across columns.

Each gallery owns one `IntersectionObserver`. Image tiles register with that observer, reveal once within `rootMargin`, and then unobserve. Do not add global scroll or resize listeners, document-wide queries, repeated geometry scans, or unloading when an image leaves the viewport.

Keep the image state contract:

```text
idle -> loading -> loaded
                -> error -> manual retry -> loading
```

- Idle and loading tiles show CSS skeleton feedback.
- Optional placeholders begin when the tile is revealed and remain decorative.
- Final images retain native `loading="lazy"` and `decoding="async"` attributes.
- Failure shows visible text and a keyboard-operable Retry button; an optional fallback stays decorative behind the message.
- Retries reuse the original URL without cache-busting and occur only after user action.
- Browsers without Intersection Observer receive every source immediately and rely on native lazy loading.

Strings normalize to `{ src, alt: "" }`. Do not infer alternative text from URLs or titles. Use React rendering for title and description content; never add raw `innerHTML` or `dangerouslySetInnerHTML` support.

## Styling

`src/styles.ts` is the authority for the namespaced `.mlli-*` defaults. The component renders it through React 19 `<style href precedence>` behavior unless `unstyled` is true.

Keep consumer customization behind documented CSS custom properties and stable classes. Preserve reduced-motion behavior, keyboard focus visibility, non-color error text, and the built-in layout defaults unless a public styling change is intentional and documented.

## Build and package rules

Rollup publishes:

- CommonJS: `lib/index.cjs.js`
- ES module: `lib/index.esm.mjs`
- TypeScript declarations: `lib/index.d.ts` and its referenced internal declarations

Keep `package.json` `main`, `module`, `types`, `typings`, conditional `exports`, and `files` synchronized with these outputs. Validate both module formats from a packed consumer boundary.

TypeScript targets current evergreen browsers with the React automatic JSX transform. `tsconfig.json` type-checks all package and example source without emitting files. `tsconfig.build.json` narrows declaration generation to the public package graph rooted at `src/index.ts`.

Do not hand-edit generated `lib`, `dist`, or `docs` content. Regenerate through the owning command.

## Tests and validation

Use repository-native commands:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm test
pnpm run docs
pnpm run preview
pnpm pack --dry-run
```

Match checks to the change. Public runtime work requires component tests, SSR import/render coverage, build inspection, declaration inspection, ESM and CommonJS consumption, and packed-file review.

Maintain tests for:

- string and object normalization, duplicate sources, empty collections, ordering, and stable IDs;
- one observer per gallery, root margin, reveal behavior, eager fallback, Strict Mode cleanup, and instance isolation;
- skeleton, placeholder, load, error, fallback, retry, callbacks, and retry attempt numbers;
- selector validation, update, destroy, repeated destroy, and update-after-destroy behavior;
- server rendering without browser globals;
- package externals, export paths, and included files.

Before handoff, inspect `git status`, the complete diff, generated declarations and bundles, and the package manifest. Preserve unrelated work. Never use `pnpm run release` or publish as validation.
