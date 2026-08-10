# Repository Guide

## Scope and public contract

This repository publishes the browser-side `mazey-lazy-load-images` package. The public entry point is `src/index.ts`, which exports only `lazyLoadImages()`. Keep `package.json` fields (`main`, `module`, and `typings`), Rollup outputs, declarations, README examples, and tests aligned whenever the public API changes.

The function accepts one configuration object:

- `images`: ordered groups shaped as `{ name, img }`, where `img` is an array of image URLs.
- `container`: a selector passed directly to `document.querySelector()`.
- `defaultImg`: the placeholder URL assigned before each final image URL is loaded.

It returns `false` when a valid selector matches no element and `true` after initialization. An invalid selector can throw a DOM exception. Image names and URLs are interpolated into `innerHTML`; treat inputs as trusted markup unless a deliberate, documented API change adds escaping or sanitization.

## Repository map and generated boundaries

- `src/index.ts`: package implementation and only public export.
- `src/example.ts`: development consumer that exercises the source entry point.
- `src/example.html`: Webpack development-page template and container markup.
- `test/`: Jest tests. The current number test is only a harness smoke test and does not cover package behavior.
- `jest.config.cjs`: limits test discovery to `test/**/*.test.js`, excluding generated browser bundles.
- `rollup.config.mjs`: Rollup 4 package bundling to CommonJS and ES module files in `lib/`.
- `webpack.config.js`: local example bundling to `dist/`; it is not the npm build.
- `tsconfig.json`: TypeScript and declaration settings for `src/index.ts`.
- `docs/`: tracked TypeDoc output. Regenerate it with `npm run docs`; do not hand-edit generated HTML or assets.
- `lib/` and `dist/`: generated, ignored output. Change sources or build configuration instead of editing them.
- `.github/workflows/`: pull-request validation and main-branch publication automation. Do not publish, push tags, or trigger release actions during local validation.

Use Node.js 22 and pnpm 10.26.2, as declared by `.nvmrc`, `engines`, and `packageManager`. `pnpm-lock.yaml` is the dependency authority; update it only when dependency work requires it. Preserve unrelated working-tree files.

## Frontend hierarchy

This package does not use React, Vue, framework components, a virtual DOM, or a component lifecycle. Treat its hierarchy as imperative DOM ownership:

```text
caller-selected container
└── .m-box                         created by lazyLoadImages()
    └── group wrapper              one per images[] entry
        ├── title wrapper
        │   └── span               "{index}. {name}"
        └── .m-img
            └── image wrapper      one per group.img[] entry
                └── img.m-img-item placeholder src + final data-src
```

`src/example.html` owns `.container > .box`; `src/example.ts` passes `.box` to the library. The library replaces all existing content inside the matched container with one generated `.m-box` tree.

## State and side effects

There is no application store. State is split between one invocation's closure and shared browser state.

Invocation-local state:

- The selected container, generated HTML strings, and a snapshot of matching image nodes.
- The `lazyLoad` callback and its 300-pixel preload threshold.
- Separate throttled scroll and resize callbacks created for that invocation.
- A placeholder `Image` instance whose `load` event schedules the initial scan.

Shared browser state:

- The selected container's `innerHTML`.
- `window` scroll position, viewport height, and global scroll/resize listeners.
- The document-wide `.m-img-item` query. It is not scoped to the selected container.
- The shared `<style id="mazey-lazy-load-images-style">`, created or updated through Mazey's `addInlineStyle()`.
- Each image element's `src`, `data-src`, layout position, and browser-native `loading="lazy"` behavior.

The function returns no teardown handle. Every successful call retains two event listeners, and their closures retain the original node snapshot. Account for this before adding repeated initialization, remounting, or multi-instance behavior.

## Configuration and data flow

The input object is prop-like but not reactive:

```text
caller configuration
├── container ──> document.querySelector() ──> innerHTML replacement target
├── images[].name ──> group title HTML
├── images[].img[] ──> img[data-src]
└── defaultImg ──> initial img[src] + placeholder preload sentinel

scroll / resize / placeholder load
└── throttled lazyLoad()
    └── compare image.offsetTop with viewport threshold
        └── copy image.dataset.src to image.src
```

Changing the caller's arrays or object after the call does not rerender. Callers must invoke the function again, which currently replaces markup and adds more listeners.

## Context usage

There is no React Context, Vue provide/inject, dependency-injection container, event bus, or custom context abstraction. The implicit context is the global `document`, `window`, `Image`, and Mazey utility implementation. Keep DOM-dependent code out of module top-level execution so importing the package does not immediately require a browser environment.

## Rendering and performance hot paths

Review changes against these existing bottlenecks and edge cases:

- Rendering builds the complete tree as strings and replaces `innerHTML` synchronously. Large collections cause allocation, parsing, and full-subtree replacement costs.
- Every successful call queries all `.m-img-item` elements in the document, so one instance can process another instance's images or unrelated matching markup.
- Each throttled scroll/resize callback scans its entire fixed node snapshot every 50 ms. Loaded nodes are not removed from the work set.
- Each scan reads `offsetTop` and may write `src`; repeated reads and writes across many images can increase layout work.
- `offsetTop` is relative to an offset parent but is compared with document scroll state, which can be inaccurate in positioned or nested scrolling layouts.
- Repeated calls multiply global listeners and retain stale or detached nodes because there is no cleanup API.
- The initial scan waits for `defaultImg` to load. An empty or failed placeholder does not trigger that path, although later scroll or resize events can still trigger loading.
- The node list is a snapshot, so later DOM additions are not observed.

Prefer regression tests before changing these behaviors. High-value cases include multiple containers, repeated initialization, missing and invalid selectors, empty image groups, placeholder load failure, nested layout, listener cleanup, and ensuring an instance does not mutate another instance's nodes. If introducing `IntersectionObserver` or a teardown API, document browser compatibility and update the public contract rather than silently changing semantics.

## Development and validation

Use the existing package scripts through pnpm:

- `pnpm run dev`: serve the Webpack example.
- `pnpm run build`: clean `lib/`, then create package bundles and declarations with Rollup.
- `pnpm test`: run Jest.
- `pnpm run docs`: regenerate tracked TypeDoc output.
- `pnpm run typecheck`: type-check the package without emitting files.
- `pnpm run lint`: lint TypeScript sources with the ESLint flat configuration.
- `pnpm run preview`: build and test.
- `pnpm run lint:fix`: lint and rewrite `src/index.ts`; inspect its diff because it is mutating.

Match validation to the change. For runtime changes, run at least `pnpm run build` and `pnpm test`, then inspect emitted declarations and both bundle formats. For documentation-only changes, use `git diff --check` and review links, commands, and API examples. Before handing off, inspect `git status` and the final diff so generated output and unrelated user changes are not accidentally included.

Do not run `pnpm run release` or publish the package as validation.
