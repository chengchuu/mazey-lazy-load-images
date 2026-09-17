# Repository Guide

## Project scope

This repository publishes `mazey-lazy-load-images`, a React 19 and TypeScript library for rendering ordered collection sections with titles, optional descriptions, and responsive CSS-column image waterfalls.

The package root exports:

- `LazyImageGallery`, an SSR-safe React component for consumer-owned React trees;
- `mountLazyImageGallery`, a browser-only helper that creates and owns one React root;
- the public gallery image, item, label, event, prop, and controller types from `src/types.ts`.

Version 2 does not export the former `lazyLoadImages({ images, container, defaultImg })` API. Do not add a compatibility adapter unless the user explicitly requests one. When a public contract changes, update the root exports, implementation, declarations, README, tests, and both Rollup outputs together.

## Repository layout

- `src/index.ts`: the only supported package-root export surface.
- `src/LazyImageGallery.tsx`: collection rendering, image state, observation, feedback, and cleanup.
- `src/mountLazyImageGallery.tsx`: mount-target validation and the imperative React root controller.
- `src/types.ts`: public TypeScript interfaces and unions.
- `src/styles.ts`: the runtime source for the namespaced default gallery stylesheet.
- `examples/example.tsx`: the interactive gallery data and mounting behavior used by Webpack.
- `examples/playground.html` and `examples/playground.css`: the maintained Pages playground template and styles.
- `examples/example.html`: a tracked standalone template that current Webpack and Pages scripts do not reference. Do not treat it as the maintained Pages template.
- `images/`: six local playground photographs and the maintained site/PWA logo files.
- `site/`: homepage, shared navigation and theme code, PWA integration, TypeDoc enhancement code, styles, and the service-worker template.
- `project.config.js`: centralized package, repository, route, SEO, theme, and PWA values derived from `package.json`.
- `scripts/rollup.config.mjs`: CommonJS, ES module, and declaration builds.
- `scripts/webpack.config.js`: homepage, playground, shared, and API enhancement assets staged in `dist-dev/`.
- `scripts/build-pages.cjs`: final `docs/` assembly, TypeDoc transformation, crawler files, manifest, icons, and service-worker generation.
- `scripts/theme-markup.cjs`: shared TypeDoc theme-button markup and strict OS-option removal.
- `scripts/validate-site.cjs`: validation of the assembled SEO, route, theme, TypeDoc, and PWA contracts.
- `test/`: gallery, mount controller, SSR, theme, site, packaging, and toolchain regression tests.
- `.github/workflows/`: Pages deployment and npm-package validation/publication.

`lib/`, `dist-dev/`, and `docs/` are ignored generated output. `dist/` is also ignored but no current script owns it. Never hand-edit any of these directories.

## Local toolchain

Use Node.js 22, matching GitHub Actions. For manual local work, use pnpm to install dependencies and npm to run repository scripts:

```bash
pnpm install
npm run typecheck
npm run lint
npm test
```

Do not add a `packageManager` field or pin a pnpm version unless the user changes this policy. Do not use `pnpm install --frozen-lockfile`. `pnpm-lock.yaml` is the tracked local dependency lockfile; `package-lock.json` is ignored and must not be committed.

GitHub Actions intentionally use `npm install`, Node.js 22, npm scripts, and no package-manager cache. Do not change CI to pnpm merely to match local installation.

## Package and runtime boundaries

React and React DOM are the package's only runtime dependencies. They intentionally remain in `dependencies`, not `devDependencies` or `peerDependencies`, while Rollup externalizes `react`, `react-dom`, `react-dom/client`, and `react/jsx-runtime`. Never bundle private React copies into `lib/`.

Mazey, Bootstrap, and Bootstrap Icons are website-only development dependencies. Package code under `src/` must not import them. The site imports Bootstrap CSS and the Bootstrap collapse module, uses Mazey for theme preference and PWA helpers, and inlines only the maintained Bootstrap Icons SVG paths.

Keep package modules safe to import and render on a server. Do not access `window`, `document`, `Image`, `Element`, or `IntersectionObserver` at module scope or during React render. Browser behavior belongs in effects or in the explicitly browser-only mount helper.

`mountLazyImageGallery()` accepts an `Element` or CSS selector and throws descriptive errors for non-browser use, invalid targets, empty selectors, and unmatched selectors. Its controller owns the React root:

```text
mountLazyImageGallery(target, props)
├── createRoot(target)
├── update(nextProps) -> root.render(...)
└── destroy() -> root.unmount()
```

`destroy()` is idempotent. `update()` after destruction throws.

## Gallery behavior

Render each item as a semantic section. Keep its heading and optional description outside that section's image waterfall; never flatten images across items. The waterfall uses CSS multi-columns with `break-inside: avoid`, which fill top-to-bottom before moving across columns. Do not replace it with experimental native masonry without an explicit browser-support decision.

Each gallery owns one `IntersectionObserver`. Tiles register with that observer, reveal when they intersect the configured `rootMargin`, and unobserve at reveal time. Do not add global scroll or resize listeners, document-wide queries, repeated geometry scans, or unloading when tiles leave the viewport. When Intersection Observer is unavailable, reveal all sources and retain native `loading="lazy"` behavior.

Preserve the image state flow:

```text
idle -> loading -> loaded
                -> error -> manual retry -> loading
```

- Idle and loading tiles render a CSS skeleton and accessible loading text.
- Placeholders load only after reveal, remain decorative, and disappear after the final image loads.
- Final images use `loading="lazy"`, `decoding="async"`, and caller-provided responsive or fetch-priority attributes.
- Errors show visible text and a keyboard-operable Retry button. Optional fallbacks remain decorative behind the error UI.
- Retries reuse the original source, increment the attempt, and occur only after user action.
- Valid intrinsic dimensions reserve space; otherwise, the component uses a positive finite default aspect ratio.

String entries normalize to `{ src, alt: "" }`. Informative images require object entries with explicit alternative text. Render titles and descriptions through React; do not add raw HTML or `dangerouslySetInnerHTML` support.

`src/styles.ts` owns the `.mlli-*` default styles and CSS custom properties. React 19 deduplicates the stylesheet through `<style href precedence>` unless `unstyled` is true. Preserve reduced-motion handling, visible keyboard focus, and text-based error feedback.

## Playground and website

The maintained playground initially renders the six local images plus 12 generated remote images. Its small view keeps only the six local images. Preserve local-first ordering, stable local IDs, intrinsic dimensions, descriptive alternative text, the deliberate broken remote URL, placeholders, fallbacks, retries, controller updates, and destroy/remount controls unless the example requirements change.

Webpack builds four entry groups into `dist-dev/`: `shared`, `home`, `playground`, and `api`. Home and playground depend on the shared Bootstrap, theme, navigation, and PWA entry. TypeDoc pages load their separate API enhancement bundle after TypeDoc's own scripts.

`project.config.js` is the source of truth for the GitHub Pages base path, stable `/`, `/playground/`, and `/api/` routes, package install command, repository URLs, metadata, theme colors, storage key, manifest values, and PWA asset names. Change centralized identity there or in its owning `package.json` field instead of duplicating literals in site modules.

The production documentation pipeline is ordered:

```text
TypeDoc -> docs/api/
Webpack --env pages -> dist-dev/
build-pages.cjs -> assembled docs/
SEO and PWA validators -> final artifact checks
```

`README.md` is also the TypeDoc readme input. `build-pages.cjs` preserves the generated API output through a temporary copy, overlays Webpack output, injects site metadata and navigation into every TypeDoc page, removes only TypeDoc's OS theme option, and generates the final manifest, crawler files, icons, and fingerprinted service worker. PWA registration is enabled only in the production Pages build.

Theme controls support concrete light and dark states. When no explicit project preference exists, Mazey resolves the initial operating-system preference. Persist only explicit project selections under the configured key. The generated API pages keep TypeDoc's native Light/Dark selector and synchronize it with the project toolbar button without dispatching synthetic change events.

## Build and publication

`npm run build` writes:

- `lib/index.cjs.js`;
- `lib/index.esm.mjs`;
- `lib/index.d.ts` and referenced internal declaration files and maps.

Keep `main`, `module`, `types`, `typings`, conditional `exports`, and `files` aligned with those outputs. The npm allowlist contains only `lib`, `README.md`, and `LICENSE`; examples, images, site code, tests, scripts, and generated website output must remain outside the package.

`tsconfig.json` type-checks package, example, and site TypeScript without emitting files. `tsconfig.build.json` restricts declaration emission to the package graph rooted at `src/index.ts`. The React automatic JSX transform, ES2022 target, and bundler module resolution are current build contracts.

Pages deploys on pushes to `main` and `release/v*`, plus manual dispatch. The npm workflow validates pull requests to `main` and `release/v*`, but publishes only on pushes to `release/v*`. Do not stage, commit, tag, push, deploy, or publish unless the user explicitly requests that action. Never run `npm run release` as validation because it ends with `npm publish`.

## Tests and validation

Use checks that match the change. Available repository commands are:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run build:site
npm run docs
npm run preview
npm pack --dry-run
```

`npm run preview` is the full local pipeline: type checking, linting, package build, serial Jest, and assembled documentation validation. It regenerates ignored `lib/`, `dist-dev/`, and `docs/` output. Do not run `scripts/build-pages.cjs` or the site validators against stale output; `npm run docs` supplies their TypeDoc and Webpack prerequisites in order.

Public runtime changes require gallery tests, SSR coverage, declaration and bundle inspection, CommonJS and ES module consumer checks, and packed-file review. Website changes require the site/theme tests and final `docs/` SEO and PWA validators. Example asset changes require a production Webpack build and inspection of emitted images.

Before handoff, inspect `git status`, the complete diff, generated outputs relevant to the change, and `git diff --check`. Preserve unrelated work, including pre-existing modifications in this checkout, and report every skipped or failed check.
