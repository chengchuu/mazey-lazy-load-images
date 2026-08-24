export const DEFAULT_STYLES: string = `
.mlli-root {
  --mlli-column-width: 240px;
  --mlli-gap: 16px;
  --mlli-radius: 8px;
  --mlli-background: #f3f4f6;
  --mlli-foreground: #1f2937;
  --mlli-muted: #6b7280;
  --mlli-error-background: #fef2f2;
  --mlli-error-foreground: #991b1b;
  --mlli-button-background: #1f2937;
  --mlli-button-foreground: #ffffff;
  box-sizing: border-box;
  color: var(--mlli-foreground);
}

.mlli-root *,
.mlli-root *::before,
.mlli-root *::after {
  box-sizing: inherit;
}

.mlli-section + .mlli-section {
  margin-block-start: calc(var(--mlli-gap) * 2);
}

.mlli-heading {
  margin: 0;
  font: inherit;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
}

.mlli-description {
  margin: 0.5rem 0 1rem;
  color: var(--mlli-muted);
  line-height: 1.6;
}

.mlli-grid {
  column-gap: var(--mlli-gap);
  column-width: var(--mlli-column-width);
}

.mlli-tile {
  position: relative;
  display: inline-block;
  width: 100%;
  margin: 0 0 var(--mlli-gap);
  overflow: hidden;
  break-inside: avoid;
  border-radius: var(--mlli-radius);
  background: var(--mlli-background);
  vertical-align: top;
  isolation: isolate;
}

.mlli-tile[data-status='loaded'] {
  background: transparent;
}

.mlli-skeleton {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(
    100deg,
    transparent 20%,
    rgb(255 255 255 / 55%) 45%,
    transparent 70%
  );
  background-size: 220% 100%;
  animation: mlli-shimmer 1.35s linear infinite;
}

.mlli-image,
.mlli-placeholder,
.mlli-fallback {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mlli-placeholder {
  z-index: 1;
  filter: blur(14px);
  opacity: 0;
  transform: scale(1.05);
  transition: opacity 180ms ease;
}

.mlli-placeholder[data-visible='true'] {
  opacity: 1;
}

.mlli-image {
  z-index: 2;
  opacity: 0;
  transition: opacity 220ms ease;
}

.mlli-image[data-loaded='true'] {
  opacity: 1;
}

.mlli-fallback {
  z-index: 1;
  opacity: 0.28;
}

.mlli-error {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--mlli-error-background) 86%, transparent);
  color: var(--mlli-error-foreground);
  text-align: center;
}

.mlli-retry {
  appearance: none;
  border: 0;
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
  background: var(--mlli-button-background);
  color: var(--mlli-button-foreground);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.mlli-retry:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

.mlli-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes mlli-shimmer {
  to {
    background-position-x: -220%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mlli-skeleton {
    animation: none;
  }

  .mlli-image,
  .mlli-placeholder {
    transition: none;
  }
}
`;
