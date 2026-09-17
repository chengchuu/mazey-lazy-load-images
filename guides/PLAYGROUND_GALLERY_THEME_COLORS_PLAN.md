# Playground gallery theme colors plan

## Summary

Make the gallery section titles and descriptions on `/playground/` readable and consistent with the page in both light and dark themes. Apply the fix only through the maintained playground stylesheet; do not change the library under `src/`.

## Cause

The website defines theme-aware text colors through `--bs-body-color` and `--site-muted`. The gallery's default stylesheet defines its own light-palette values for `--mlli-foreground` and `--mlli-muted` on `.mlli-root`.

On the dark playground, the gallery values override inherited page colors. The gallery heading therefore renders in a very dark foreground, and the description uses a muted color with insufficient contrast against the page background.

## Scope

- Modify only `examples/playground.css` during implementation.
- Scope the override to the gallery mounted under `#gallery`.
- Preserve the current playground title, description, controls, gallery data, and theme behavior.
- Preserve the library defaults and public runtime code under `src/`.
- Do not change the homepage, generated TypeDoc pages, shared site theme implementation, or package API.

## Implementation

1. Target the gallery's `.mlli-root` below `#gallery` so the playground rule overrides the variables declared directly on the library root.
2. Map `--mlli-foreground` to the page's `--bs-body-color` token.
3. Map `--mlli-muted` to the page's `--site-muted` token.
4. Keep the heading visually aligned with primary page text while retaining a clear muted hierarchy for gallery descriptions.
5. Avoid fixed light- or dark-theme color values and avoid separate theme-specific selectors.

## Expected behavior

- In the light theme, gallery headings and descriptions use the website's light-theme text palette.
- In the dark theme, gallery headings remain clearly readable and descriptions use the website's dark-theme muted text.
- Theme toggling updates the gallery colors through existing custom-property inheritance without remounting or updating the gallery.
- Gallery loading, errors, buttons, images, layout, and callbacks remain unchanged.

## Validation

Run the existing website checks without adding implementation-specific tests:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build:site
npm run preview
```

Browser-check the maintained `/playground/` page:

- Compare the gallery heading with the page's primary text in light and dark themes.
- Confirm the gallery description is readable while remaining visually subordinate.
- Toggle the theme without reloading and verify both colors update immediately.
- Check all gallery sections after switching between the 6-image and 18-image views.
- Check narrow, tablet, and desktop widths.
- Confirm controls, error feedback, placeholders, and image tiles are unchanged.

## Risks

- The playground becomes intentionally dependent on `--bs-body-color` and `--site-muted`, which are website tokens rather than library tokens.
- Future site palette changes will also update gallery text. This is desirable for theme consistency but should be included in visual QA.
- Mapping both gallery variables to the primary body color would remove the title-description hierarchy; retain `--site-muted` for descriptions unless the design requirement changes.
- An override placed only on `#gallery` would be inherited and then replaced by the library's declarations on `.mlli-root`. The selector must target the gallery root itself.

## Alternatives not selected

- Changing `src/styles.ts` would alter the published library and exceed the playground-only scope.
- Styling `.mlli-heading` and `.mlli-description` directly would couple the example to internal element rules instead of using documented customization variables.
- Passing custom properties through `example.tsx` would mix page presentation with gallery data and require unnecessary TypeScript handling.
- Adding only dark-theme overrides would duplicate palette values and could leave the light theme inconsistent.

## Assumptions

- The requested compatibility means using the playground's theme-aware color system rather than making the gallery title and description identical in emphasis.
- `--bs-body-color` and `--site-muted` remain available because the playground loads the shared website stylesheet.
- The implementation should not modify automated tests because the requested code scope is limited to the playground stylesheet.
