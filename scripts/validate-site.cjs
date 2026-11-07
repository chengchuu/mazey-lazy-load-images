const assert = require("node:assert/strict");
const { existsSync, readFileSync, readdirSync, statSync } = require("node:fs");
const path = require("node:path");
const config = require("../project.config.js");
const {
  attributeValue,
  openingTags,
  localReferences,
} = require("./html-attributes.cjs");
const docs = path.resolve(__dirname, "../docs");
const mode = process.argv[2];

function read(relative) {
  const file = path.join(docs, relative);
  assert.ok(existsSync(file), `Missing docs/${relative}`);
  return readFileSync(file, "utf8");
}
function htmlFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const absolute = path.join(directory, name);
    return statSync(absolute).isDirectory()
      ? htmlFiles(absolute)
      : absolute.endsWith(".html")
        ? [absolute]
        : [];
  });
}
function validateThemeToggle(file, html) {
  const buttons = [
    ...html.matchAll(
      /<button\b(?=[^>]*\bdata-theme-toggle\b)[^>]*>[\s\S]*?<\/button>/gi,
    ),
  ];
  assert.equal(buttons.length, 1, `${file} must have one theme toggle`);
  const button = buttons[0][0];
  const opening = button.match(/<button\b[^>]*>/i)[0];
  assert.equal(attributeValue(opening, "type"), "button");
  assert.match(attributeValue(opening, "class") ?? "", /\btheme-toggle\b/);
  assert.equal(
    attributeValue(opening, "aria-label"),
    "Current theme: Light. Switch to dark theme.",
    `${file} has an invalid initial theme label`,
  );
  assert.ok(!/\baria-pressed\b/i.test(opening));
  for (const theme of ["light", "dark"]) {
    const icons = openingTags(button, "svg").filter(
      (tag) => attributeValue(tag, "data-theme-icon") === theme,
    );
    assert.equal(icons.length, 1, `${file} must have one ${theme} theme icon`);
    const icon = icons[0];
    assert.equal(attributeValue(icon, "width"), "16");
    assert.equal(attributeValue(icon, "height"), "16");
    assert.equal(attributeValue(icon, "aria-hidden"), "true");
    assert.equal(attributeValue(icon, "focusable"), "false");
    assert.equal(/\shidden(?:\s|>|=)/i.test(icon), theme === "dark");
  }
  assert.ok(!/\bdata-theme-select\b/i.test(html));
}
function validateTypeDocThemeSelector(file, html) {
  const selectors = [
    ...html.matchAll(
      /<select\b(?=[^>]*\bid=["']tsd-theme["'])[^>]*>([\s\S]*?)<\/select>/gi,
    ),
  ];
  assert.equal(
    selectors.length,
    1,
    `${file} must retain one native TypeDoc theme selector`,
  );
  const options = [
    ...selectors[0][1].matchAll(
      /<option\b[^>]*\bvalue=["']([^"']+)["'][^>]*>([^<]*)<\/option>/gi,
    ),
  ].map((option) => [option[1], option[2].trim()]);
  assert.deepEqual(options, [
    ["light", "Light"],
    ["dark", "Dark"],
  ]);
  const typeDocScript = html.indexOf('assets/main.js"');
  const projectScript = html.indexOf('assets/api.js"');
  assert.ok(typeDocScript >= 0, `${file} is missing the TypeDoc main script`);
  assert.ok(projectScript >= 0, `${file} is missing the project API script`);
  assert.ok(
    typeDocScript < projectScript,
    `${file} must initialize TypeDoc before the project theme integration`,
  );
}
function validateLocalReferences(file, html, pageUrl) {
  const siteUrl = new URL(config.site.url);
  for (const reference of localReferences(html)) {
    if (/^(?:data:|mailto:|tel:|javascript:)/i.test(reference)) continue;
    const url = new URL(reference, pageUrl);
    if (
      url.origin !== siteUrl.origin ||
      !url.pathname.startsWith(config.site.basePath)
    )
      continue;
    let relative = url.pathname.slice(config.site.basePath.length);
    if (!relative || relative.endsWith("/")) relative += "index.html";
    assert.ok(
      existsSync(path.join(docs, relative)),
      `${file} references missing ${url.pathname}`,
    );
  }
}
const pages = [
  ["index.html", config.site.pages.home],
  ["playground/index.html", config.site.pages.playground],
  ["api/index.html", config.site.pages.api],
];
if (mode === "seo") {
  for (const [file, page] of pages) {
    const html = read(file);
    assert.match(
      html,
      new RegExp(
        `<title>${page.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</title>`,
      ),
    );
    assert.ok(
      openingTags(html, "meta").some(
        (tag) =>
          attributeValue(tag, "name") === "description" &&
          attributeValue(tag, "content"),
      ),
      `${file} is missing a meta description`,
    );
    const canonicals = openingTags(html, "link").filter(
      (tag) => attributeValue(tag, "rel") === "canonical",
    );
    assert.equal(canonicals.length, 1, `${file} must have one canonical`);
    assert.equal(attributeValue(canonicals[0], "href"), page.url);
    assert.ok(
      openingTags(html, "meta").some(
        (tag) =>
          attributeValue(tag, "property") === "og:url" &&
          attributeValue(tag, "content") === page.url,
      ),
      `${file} has an invalid og:url`,
    );
    assert.equal(
      (html.match(/<h1\b/g) ?? []).length,
      1,
      `${file} must have one h1`,
    );
    validateLocalReferences(file, html, page.url);
    validateThemeToggle(file, html);
  }
  for (const file of htmlFiles(path.join(docs, "api"))) {
    const relative = path.relative(docs, file).replaceAll(path.sep, "/");
    const html = read(relative);
    validateThemeToggle(relative, html);
    validateTypeDocThemeSelector(relative, html);
  }
  const sitemapLocations = [
    ...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g),
  ].map((match) => match[1]);
  assert.deepEqual(
    sitemapLocations,
    pages.map(([, page]) => page.url),
  );
  assert.ok(read("robots.txt").includes(`Sitemap: ${config.urls.sitemap}`));
} else if (mode === "pwa") {
  for (const file of htmlFiles(docs)) {
    const relative = path.relative(docs, file).replaceAll(path.sep, "/");
    const html = read(relative);
    for (const forbidden of [
      "data-pwa-update",
      "data-pwa-update-now",
      "pwa-update",
      "pwa-update-notice",
      "site-pwa-update",
    ]) {
      assert.ok(
        !html.includes(forbidden),
        `${relative} contains removed update UI: ${forbidden}`,
      );
    }
  }
  for (const [file] of pages) {
    const html = read(file);
    assert.ok(
      openingTags(html, "link").some(
        (tag) => attributeValue(tag, "rel") === "manifest",
      ),
    );
    assert.ok(
      openingTags(html, "meta").some(
        (tag) => attributeValue(tag, "name") === "theme-color",
      ),
    );
  }
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.scope, config.site.basePath);
  assert.equal(manifest.start_url, config.site.basePath);
  assert.deepEqual(
    manifest.icons.map((icon) => icon.sizes),
    ["192x192", "512x512", "512x512"],
  );
  for (const [file] of config.pwa.icons) read(`images/${file}`);
  const worker = read("service-worker.js");
  assert.ok(!worker.includes("__PWA_"));
  assert.ok(!/SKIP_WAITING|skipWaiting\s*\(/.test(worker));
  assert.ok(worker.includes(config.site.basePath));
  assert.ok(worker.includes("`${PROJECT_BASE}assets/playground.css`"));
  for (const asset of [
    "style.css",
    "highlight.css",
    "main.js",
    "icons.js",
    "search.js",
    "navigation.js",
  ]) {
    assert.ok(
      worker.includes(`${config.site.basePath}api/assets/${asset}`),
      `Service worker is missing TypeDoc asset ${asset}`,
    );
  }
} else throw new Error("Use seo or pwa validation mode.");
console.log(`${mode.toUpperCase()} validation passed.`);
