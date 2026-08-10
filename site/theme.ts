import {
  listenMediaQueryChanges,
  resolveThemePreference,
  setThemePreference,
} from "mazey";
import type { ResolvedTheme, ThemePreference } from "mazey";

export function initializeThemeControls(storageKey: string): () => void {
  const root = document.documentElement;
  if (root.dataset.themeControlsReady === "true") return () => undefined;

  let media: MediaQueryList | null = null;
  try {
    media = window.matchMedia("(prefers-color-scheme: dark)");
  } catch {
    // Mazey supplies a light fallback when media queries are unavailable.
  }
  const resolved = (preference: ThemePreference): ResolvedTheme =>
    preference === "system" ? (media?.matches ? "dark" : "light") : preference;
  const apply = (preference: ThemePreference, theme: ResolvedTheme) => {
    root.dataset.bsTheme = theme;
    root.style.colorScheme = theme;
    document
      .querySelectorAll<HTMLSelectElement>("[data-theme-select]")
      .forEach((control) => {
        control.value = preference;
      });
    const meta = document.querySelector<HTMLMetaElement>(
      "meta[data-theme-color]",
    );
    if (meta)
      meta.content =
        theme === "dark"
          ? (meta.dataset.themeColorDark ?? meta.content)
          : (meta.dataset.themeColorLight ?? meta.content);
    try {
      window.localStorage.setItem(
        "tsd-theme",
        preference === "system" ? "os" : preference,
      );
    } catch {
      // TypeDoc synchronization is best effort.
    }
  };
  const initial = resolveThemePreference(storageKey);
  let preference: ThemePreference =
    initial.label === "System" ? "system" : initial.value;
  const change = (event: Event) => {
    const select = event.target;
    if (
      !(select instanceof HTMLSelectElement) ||
      !select.matches("[data-theme-select]")
    )
      return;
    const next = select.value as ThemePreference;
    try {
      setThemePreference(storageKey, next);
      preference = next;
      apply(next, resolved(next));
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      apply(preference, resolved(preference));
    }
  };
  const systemChange = () => {
    if (preference === "system") apply(preference, resolved(preference));
  };
  root.dataset.themeControlsReady = "true";
  apply(preference, initial.value);
  document.addEventListener("change", change);
  const stopMedia = listenMediaQueryChanges(media, systemChange);
  return () => {
    document.removeEventListener("change", change);
    stopMedia();
    delete root.dataset.themeControlsReady;
  };
}
