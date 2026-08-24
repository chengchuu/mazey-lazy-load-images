# Image tile background bleed fix plan

## Summary

Remove the border-like halo around loaded images without weakening the existing loading and error feedback. Keep the tile background for non-loaded states and make only loaded tiles transparent.

## Cause

`.mlli-tile` always paints `var(--mlli-background)`, which defaults to `#f3f4f6`. The final image covers the tile, but rounded `overflow: hidden` clipping and fractional CSS-column widths can expose an antialiased strip of the tile background. The strip resembles a border, especially when the gallery appears on a dark page.

The background also supplies the solid base beneath the skeleton's transparent shimmer gradient. Removing it from every tile would fix the loaded edge but degrade loading feedback.

## Scope

- Update the default gallery stylesheet in `src/styles.ts`.
- Preserve the existing `--mlli-background` custom property.
- Preserve idle, loading, and error feedback.
- Keep the existing border radius, overflow clipping, image sizing, waterfall layout, and React state model.
- Do not add JavaScript state, image scaling, negative insets, or browser-specific workarounds.

## Implementation

1. Retain the existing tile background as the default for idle, loading, and error states.
2. Add a loaded-state style that makes the tile background transparent when `data-status="loaded"`.
3. Keep the final image's current opacity transition, positioning, and `object-fit: cover` behavior.
4. Update documentation only if the meaning of `--mlli-background` needs clarification after browser verification.

## Regression coverage

- Keep the existing component test that verifies the tile reaches `data-status="loaded"` after the final image loads.
- Add a focused stylesheet contract assertion only if it can verify the loaded-state rule without duplicating the complete CSS text.
- Do not treat jsdom as visual evidence; it cannot reproduce browser antialiasing at rounded clipping edges.

## Validation

Run the focused and repository checks:

```bash
npm test -- --runInBand test/gallery.test.tsx
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run preview
npm pack --dry-run
```

Browser-check the maintained playground in current Chrome, Firefox, and Safari:

- Verify loaded cards have no border-like halo in light and dark themes.
- Check normal zoom and at least one fractional zoom level.
- Check standard- and high-density displays when available.
- Confirm skeletons retain their solid base and shimmer before reveal and while loading.
- Confirm placeholders, success fade-in, errors, fallbacks, and Retry remain visually correct.
- Confirm rounded corners still clip images without square-edge leakage.

## Risks

- A loaded image fades over the consumer's page background instead of the light tile background. This can slightly change the 220 ms success transition.
- Consumers might have relied on the loaded tile background as a visible frame, although the package does not define it as a border.
- A selector tied to `data-status="loaded"` depends on the existing status attribute remaining part of the internal styling contract.
- Browser antialiasing differs by engine, zoom, and device pixel ratio, so automated DOM tests cannot replace browser QA.

## Alternatives not selected

- Removing the tile background globally would weaken the skeleton because its shimmer uses transparent stops.
- Moving the background entirely into the skeleton would also change the error and fade-in underlay.
- Enlarging or offsetting the image could crop content and create new compositing artifacts.
- Fixing only `examples/playground.css` would hide the defect in the example while leaving it in the published library.

## Assumptions

- The unwanted line appears after the final image reaches the loaded state.
- Loaded cards should blend with the surrounding consumer background rather than display a default frame.
- The existing background remains appropriate for loading and error feedback.
