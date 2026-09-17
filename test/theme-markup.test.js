const { readFileSync } = require("node:fs");
const path = require("node:path");
const {
  removeTypeDocOsThemeOption,
  themeToggleHtml,
} = require("../scripts/theme-markup.cjs");

const selector =
  '<select id="tsd-theme"><option value="os">OS</option><option value="light">Light</option><option value="dark">Dark</option></select>';

test("TypeDoc transformation removes only the native OS option", () => {
  const output = removeTypeDocOsThemeOption(selector, "index.html", false);
  expect(output).toBe(
    '<select id="tsd-theme"><option value="light">Light</option><option value="dark">Dark</option></select>',
  );
  expect(removeTypeDocOsThemeOption(output, "index.html", true)).toBe(output);
});

test("TypeDoc transformation rejects missing or ambiguous controls", () => {
  expect(() =>
    removeTypeDocOsThemeOption("<main></main>", "index.html", false),
  ).toThrow(/exactly one TypeDoc theme selector/);
  expect(() =>
    removeTypeDocOsThemeOption(selector + selector, "index.html", false),
  ).toThrow(/exactly one TypeDoc theme selector/);
  expect(() =>
    removeTypeDocOsThemeOption(
      selector.replace('<option value="os">OS</option>', ""),
      "index.html",
      false,
    ),
  ).toThrow(/exactly one TypeDoc OS theme option/);
  expect(() =>
    removeTypeDocOsThemeOption(
      selector.replace(
        '<option value="os">OS</option>',
        '<option value="os">OS</option><option value="os">OS</option>',
      ),
      "index.html",
      false,
    ),
  ).toThrow(/exactly one TypeDoc OS theme option/);
});

test("generated toolbar control uses the shared button contract", () => {
  const button = themeToggleHtml();
  expect(button).toContain('class="theme-toggle"');
  expect(button).toContain('type="button"');
  expect(button).toContain("data-theme-toggle");
  expect(button).toContain(
    'aria-label="Current theme: Light. Switch to dark theme."',
  );
  expect(button).not.toContain("aria-pressed");
  expect(button.match(/data-theme-icon=/g)).toHaveLength(2);
  expect(button.match(/width="16"/g)).toHaveLength(2);
  expect(button.match(/height="16"/g)).toHaveLength(2);
  for (const file of ["sun-fill.svg", "moon-stars-fill.svg"]) {
    const svg = readFileSync(
      path.join("node_modules", "bootstrap-icons", "icons", file),
      "utf8",
    );
    for (const match of svg.matchAll(/d="([^"]+)"/g))
      expect(button).toContain(match[1]);
  }
});
