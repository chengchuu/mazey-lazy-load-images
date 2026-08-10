const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const config = require("../project.config.js");
const docs = path.resolve(__dirname, "../docs");
const mode = process.argv[2];

function read(relative) {
  const file = path.join(docs, relative);
  assert.ok(existsSync(file), `Missing docs/${relative}`);
  return readFileSync(file, "utf8");
}
function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}
function validateLocalReferences(file, html, pageUrl) {
  const siteUrl = new URL(config.site.url);
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const reference = match[1];
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
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.ok(html.includes(`rel="canonical" href="${page.url}"`));
    assert.ok(html.includes(`property="og:url" content="${page.url}"`));
    assert.equal(
      count(html, 'rel="canonical"'),
      1,
      `${file} must have one canonical`,
    );
    assert.equal(
      (html.match(/<h1\b/g) ?? []).length,
      1,
      `${file} must have one h1`,
    );
    validateLocalReferences(file, html, page.url);
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
  for (const [file] of pages) {
    const html = read(file);
    assert.ok(html.includes('rel="manifest"'));
    assert.ok(html.includes('name="theme-color"'));
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
