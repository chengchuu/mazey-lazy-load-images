/** @jest-environment jsdom */

import { readFileSync } from "node:fs";
import path from "node:path";
import { jest } from "@jest/globals";
import { initializeThemeControls as initializeThemeControlsSource } from "../site/theme.ts";
import projectConfig from "../project.config.js";

const { colorPrimary, colorLight, colorDark, storageKey } =
  projectConfig.site.theme;
const themeControlCleanups = new Set();

function initializeThemeControls(key) {
  const cleanup = initializeThemeControlsSource(key);
  themeControlCleanups.add(cleanup);
  return cleanup;
}

function mediaQuery(matches = false) {
  return {
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
}

function installMatchMedia(media) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn(() => media),
  });
}

function buttonMarkup() {
  return `<button class="theme-toggle" type="button" data-theme-toggle
    aria-label="Current theme: Light. Switch to dark theme.">
    <svg data-theme-icon="light" aria-hidden="true" focusable="false"></svg>
    <svg data-theme-icon="dark" aria-hidden="true" focusable="false" hidden></svg>
  </button>`;
}

function renderThemeControls({ buttonCount = 1, typeDoc = false } = {}) {
  document.documentElement.removeAttribute("data-theme-controls-ready");
  document.head.innerHTML = `<meta name="theme-color" content="${colorPrimary}"
    data-theme-color data-theme-color-light="${colorLight}"
    data-theme-color-dark="${colorDark}">`;
  document.body.innerHTML = `${buttonMarkup().repeat(buttonCount)}${
    typeDoc
      ? '<select id="tsd-theme"><option value="light">Light</option><option value="dark">Dark</option></select>'
      : ""
  }`;
}

function expectRenderedTheme(theme) {
  const current = theme === "light" ? "Light" : "Dark";
  const next = theme === "light" ? "dark" : "light";
  expect(document.documentElement.dataset.bsTheme).toBe(theme);
  expect(document.documentElement.dataset.theme).toBe(theme);
  expect(document.documentElement.style.colorScheme).toBe(theme);
  expect(document.querySelector('meta[name="theme-color"]').content).toBe(
    theme === "light" ? colorLight : colorDark,
  );
  for (const button of document.querySelectorAll("[data-theme-toggle]")) {
    expect(button.getAttribute("aria-label")).toBe(
      `Current theme: ${current}. Switch to ${next} theme.`,
    );
    expect(button.hasAttribute("aria-pressed")).toBe(false);
    expect(
      button.querySelector('[data-theme-icon="light"]').hasAttribute("hidden"),
    ).toBe(theme !== "light");
    expect(
      button.querySelector('[data-theme-icon="dark"]').hasAttribute("hidden"),
    ).toBe(theme !== "dark");
  }
}

afterEach(() => {
  themeControlCleanups.forEach((cleanup) => cleanup());
  themeControlCleanups.clear();
  jest.restoreAllMocks();
  localStorage.clear();
  history.replaceState({}, "", "/");
  document.documentElement.removeAttribute("data-theme-controls-ready");
  document.documentElement.removeAttribute("data-bs-theme");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.removeProperty("color-scheme");
});

test("templates use official accessible Bootstrap theme icons", () => {
  const iconPaths = ["sun-fill.svg", "moon-stars-fill.svg"].flatMap((file) =>
    [
      ...readFileSync(
        path.join("node_modules", "bootstrap-icons", "icons", file),
        "utf8",
      ).matchAll(/d="([^"]+)"/g),
    ].map((match) => match[1]),
  );

  for (const file of ["site/index.html", "examples/playground.html"]) {
    const html = readFileSync(file, "utf8");
    expect(html).toContain("data-theme-toggle");
    expect(html).not.toContain("data-theme-select");
    expect(html).not.toContain("aria-pressed");
    const icons = [
      ...html.matchAll(/<svg\b[^>]*data-theme-icon="(?:light|dark)"[^>]*>/g),
    ];
    expect(icons).toHaveLength(2);
    for (const [icon] of icons) {
      expect(icon).toContain('width="16"');
      expect(icon).toContain('height="16"');
      expect(icon).toContain('aria-hidden="true"');
      expect(icon).toContain('focusable="false"');
    }
    expect(icons[0][0]).not.toMatch(/\shidden(?:\s|>|=)/);
    expect(icons[1][0]).toMatch(/\shidden(?:\s|>|=)/);
    for (const iconPath of iconPaths) expect(html).toContain(iconPath);
  }
});

test("theme controls use compact circular targets", () => {
  const siteCss = readFileSync("site/site.css", "utf8");
  const apiCss = readFileSync("site/api.css", "utf8");
  const siteButton = siteCss.match(/\.theme-toggle\s*\{([^}]*)\}/)[1];
  const siteIcon = siteCss.match(/\.theme-toggle svg\s*\{([^}]*)\}/)[1];
  const apiButton = apiCss.match(
    /\.site-project-links \.theme-toggle\s*\{([^}]*)\}/,
  )[1];
  const apiIcon = apiCss.match(
    /\.site-project-links \.theme-toggle svg\s*\{([^}]*)\}/,
  )[1];

  expect(siteButton).toMatch(/(?:^|\s)width: 32px;/);
  expect(siteButton).toMatch(/(?:^|\s)height: 32px;/);
  expect(siteButton).toMatch(/(?:^|\s)padding: 7px;/);
  expect(siteButton).toContain("box-sizing: border-box");
  expect(siteButton).toContain("border-radius: 50%");
  expect(siteIcon).toMatch(/(?:^|\s)width: 16px;/);
  expect(siteIcon).toMatch(/(?:^|\s)height: 16px;/);
  expect(apiButton).toMatch(/(?:^|\s)width: 28px;/);
  expect(apiButton).toMatch(/(?:^|\s)height: 28px;/);
  expect(apiButton).toContain("box-sizing: border-box");
  expect(apiButton).toContain("border-radius: 50%");
  expect(apiIcon).toMatch(/(?:^|\s)width: 16px;/);
  expect(apiIcon).toMatch(/(?:^|\s)height: 16px;/);
});

test("storage-key URL preference overrides without persisting", () => {
  renderThemeControls({ typeDoc: true });
  history.replaceState({}, "", `/?${storageKey}=dark`);
  localStorage.setItem(storageKey, "light");
  const media = mediaQuery(false);
  installMatchMedia(media);

  const cleanup = initializeThemeControls(storageKey);
  expectRenderedTheme("dark");
  expect(localStorage.getItem(storageKey)).toBe("light");
  expect(localStorage.getItem("tsd-theme")).toBe("dark");
  expect(document.querySelector("#tsd-theme").value).toBe("dark");
  expect(media.addEventListener).not.toHaveBeenCalled();
  expect(media.addListener).not.toHaveBeenCalled();
  cleanup();
});

test.each([
  ["light", true],
  ["dark", false],
])("saved %s preference remains concrete", (preference, systemDark) => {
  renderThemeControls();
  localStorage.setItem(storageKey, preference);
  const media = mediaQuery(systemDark);
  installMatchMedia(media);

  const cleanup = initializeThemeControls(storageKey);
  expectRenderedTheme(preference);
  expect(media.addEventListener).not.toHaveBeenCalled();
  expect(media.addListener).not.toHaveBeenCalled();
  media.matches = !systemDark;
  expectRenderedTheme(preference);
  cleanup();
});

test.each([
  [false, "light"],
  [true, "dark"],
])("missing preference resolves OS once as %s", (systemDark, expected) => {
  renderThemeControls({ typeDoc: true });
  const media = mediaQuery(systemDark);
  installMatchMedia(media);

  const cleanup = initializeThemeControls(storageKey);
  expectRenderedTheme(expected);
  expect(localStorage.getItem(storageKey)).toBeNull();
  expect(localStorage.getItem("tsd-theme")).toBe(expected);
  expect(document.querySelector("#tsd-theme").value).toBe(expected);
  expect(media.addEventListener).not.toHaveBeenCalled();
  expect(media.addListener).not.toHaveBeenCalled();
  media.matches = !systemDark;
  expectRenderedTheme(expected);
  cleanup();
});

test("stale TypeDoc OS storage normalizes without persisting a project theme", () => {
  renderThemeControls({ typeDoc: true });
  localStorage.setItem("tsd-theme", "os");
  installMatchMedia(mediaQuery(true));

  const cleanup = initializeThemeControls(storageKey);
  expectRenderedTheme("dark");
  expect(localStorage.getItem(storageKey)).toBeNull();
  expect(localStorage.getItem("tsd-theme")).toBe("dark");
  expect(document.querySelector("#tsd-theme").value).toBe("dark");
  cleanup();
});

test("invalid storage falls through to OS without rewriting the project key", () => {
  renderThemeControls();
  localStorage.setItem(storageKey, "invalid");
  installMatchMedia(mediaQuery(true));
  const cleanup = initializeThemeControls(storageKey);
  expectRenderedTheme("dark");
  expect(localStorage.getItem(storageKey)).toBe("invalid");
  cleanup();
});

test("unavailable media queries use the light fallback", () => {
  renderThemeControls();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => {
      throw new Error("Media query unavailable");
    },
  });
  const cleanup = initializeThemeControls(storageKey);
  expectRenderedTheme("light");
  expect(localStorage.getItem(storageKey)).toBeNull();
  cleanup();
});

test("all controls toggle together and persist every explicit theme", () => {
  renderThemeControls({ buttonCount: 2 });
  installMatchMedia(mediaQuery(false));
  const cleanup = initializeThemeControls(storageKey);
  const [first, second] = document.querySelectorAll("[data-theme-toggle]");

  first.click();
  expectRenderedTheme("dark");
  expect(localStorage.getItem(storageKey)).toBe("dark");
  second.click();
  expectRenderedTheme("light");
  expect(localStorage.getItem(storageKey)).toBe("light");
  cleanup();
});

test("failed persistence retains the explicit session theme", () => {
  renderThemeControls();
  installMatchMedia(mediaQuery(true));
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("Storage unavailable", "SecurityError");
  });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Storage unavailable", "SecurityError");
  });

  const cleanup = initializeThemeControls(storageKey);
  expectRenderedTheme("dark");
  expect(() =>
    document.querySelector("[data-theme-toggle]").click(),
  ).not.toThrow();
  expectRenderedTheme("light");
  cleanup();
});

test("TypeDoc changes synchronize without recursive events", () => {
  renderThemeControls({ typeDoc: true });
  installMatchMedia(mediaQuery(false));
  const control = document.querySelector("#tsd-theme");
  const observed = jest.fn(() => {
    document.documentElement.dataset.theme = control.value;
    localStorage.setItem("tsd-theme", control.value);
  });
  control.addEventListener("change", observed);
  const cleanup = initializeThemeControls(storageKey);

  control.value = "dark";
  control.dispatchEvent(new Event("change", { bubbles: true }));
  expectRenderedTheme("dark");
  expect(localStorage.getItem(storageKey)).toBe("dark");
  expect(observed).toHaveBeenCalledTimes(1);
  document.querySelector("[data-theme-toggle]").click();
  expectRenderedTheme("light");
  expect(control.value).toBe("light");
  expect(observed).toHaveBeenCalledTimes(1);
  cleanup();
});

test("unsupported TypeDoc values restore the concrete theme", () => {
  renderThemeControls({ typeDoc: true });
  installMatchMedia(mediaQuery(false));
  const control = document.querySelector("#tsd-theme");
  const cleanup = initializeThemeControls(storageKey);
  control.append(new Option("Unsupported", "unsupported"));
  control.value = "unsupported";
  control.dispatchEvent(new Event("change", { bubbles: true }));

  expectRenderedTheme("light");
  expect(control.value).toBe("light");
  expect(localStorage.getItem("tsd-theme")).toBe("light");
  expect(localStorage.getItem(storageKey)).toBeNull();
  cleanup();
});

test("duplicate initialization and cleanup remain idempotent", () => {
  renderThemeControls();
  const media = mediaQuery(false);
  installMatchMedia(media);
  const cleanup = initializeThemeControls(storageKey);
  const duplicateCleanup = initializeThemeControls(storageKey);
  duplicateCleanup();
  cleanup();
  cleanup();
  document.querySelector("[data-theme-toggle]").click();
  expectRenderedTheme("light");
  expect(media.removeEventListener).not.toHaveBeenCalled();
  expect(media.removeListener).not.toHaveBeenCalled();
});
