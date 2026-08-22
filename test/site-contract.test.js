const fs = require("node:fs");
const path = require("node:path");
const config = require("../project.config.js");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("central configuration keeps stable routes below the project base", () => {
  expect(config.site.basePath).toBe("/mazey-lazy-load-images/");
  expect(config.site.pages.home.url).toBe(
    "https://chengchuu.github.io/mazey-lazy-load-images/",
  );
  expect(config.site.pages.playground.url).toBe(
    "https://chengchuu.github.io/mazey-lazy-load-images/playground/",
  );
  expect(config.site.pages.api.url).toBe(
    "https://chengchuu.github.io/mazey-lazy-load-images/api/",
  );
  expect(config.package.installCommand).toBe(
    "npm install mazey-lazy-load-images",
  );
});

test("website theme source delegates shared behavior to Mazey", () => {
  const source = read("site/theme.ts");
  expect(source).toMatch(/resolveThemePreference\(storageKey\)\.value/);
  expect(source).toMatch(/setThemePreference\(storageKey, nextTheme\)/);
  expect(source).not.toMatch(/listenMediaQueryChanges/);
  expect(source).not.toMatch(/localStorage\.setItem\(storageKey/);
});

test("service worker limits requests and preserves its app shell", () => {
  const source = read("site/service-worker.js");
  expect(source).toMatch(/request\.method === "GET"/);
  expect(source).toMatch(/url\.origin === self\.location\.origin/);
  expect(source).toMatch(/url\.pathname\.startsWith\(PROJECT_BASE\)/);
  expect(source).toMatch(/!url\.pathname\.endsWith\("\.map"\)/);
  expect(source).toMatch(/!APP_SHELL_PATHS\.has/);
  expect(source).toContain("`${PROJECT_BASE}assets/playground.css`");
  expect(source).toContain("...API_APP_SHELL");
});

test("Pages cache fingerprint hashes artifact contents", () => {
  const source = read("scripts/build-pages.cjs");
  expect(source).toMatch(/fingerprintHash\.update\(readFileSync\(file\)\)/);
  expect(source).not.toMatch(/readFileSync\(file\)\.byteLength/);
});

test("Pages assembly is cross-filesystem safe and discovers TypeDoc assets", () => {
  const source = read("scripts/build-pages.cjs");
  expect(source).toMatch(/cpSync\(api, path\.join\(temporary, "api"\)/);
  expect(source).not.toMatch(/renameSync/);
  expect(source).toMatch(/function apiAppShellAssets/);
  expect(source).toMatch(/__PWA_API_APP_SHELL__/);
  expect(source).toMatch(/mlli-seo:start/);
});

test("release workflows keep Pages and npm publication boundaries separate", () => {
  const pages = read(".github/workflows/pages.yml");
  const publish = read(".github/workflows/publish-npm.yml");
  expect(pages).toContain('branches: [main, "release/v*"]');
  expect(pages).toContain("package-manager-cache: false");
  expect(pages).toContain("include-hidden-files: true");
  expect(publish).toContain('branches: ["release/v*"]');
  expect(publish).toContain("github.event_name == 'push'");
  expect(publish).toContain("startsWith(github.ref, 'refs/heads/release/v')");
  expect(publish).not.toMatch(/branches:\s*\[main\]/);
});

test("website dependencies remain development-only", () => {
  const pkg = require("../package.json");
  expect(pkg.dependencies).toEqual({
    react: "^19.0.0",
    "react-dom": "^19.0.0",
  });
  expect(pkg.devDependencies.bootstrap).toBe("5.3.8");
  expect(pkg.devDependencies["bootstrap-icons"]).toBe("^1.13.1");
  expect(pkg.devDependencies.mazey).toBe("^5.7.3");
});
