const { createHash } = require("node:crypto");
const {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const config = require("../project.config.js");

const root = path.resolve(__dirname, "..");
const docs = path.join(root, "docs");
const api = path.join(docs, "api");
const builtSite = path.join(root, "dist-dev");
const seoStart = "<!-- mlli-seo:start -->";
const seoEnd = "<!-- mlli-seo:end -->";
if (!existsSync(path.join(api, "index.html")))
  throw new Error("TypeDoc API output is missing.");
if (!existsSync(path.join(builtSite, "index.html")))
  throw new Error("Webpack site output is missing.");

const temporary = mkdtempSync(path.join(tmpdir(), "mlli-pages-"));
try {
  cpSync(api, path.join(temporary, "api"), { recursive: true });
  rmSync(docs, { recursive: true, force: true });
  mkdirSync(docs, { recursive: true });
  cpSync(path.join(temporary, "api"), api, { recursive: true });
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
cpSync(builtSite, docs, { recursive: true });

function escape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function files(directory, extension) {
  return readdirSync(directory).flatMap((name) => {
    const absolute = path.join(directory, name);
    return statSync(absolute).isDirectory()
      ? files(absolute, extension)
      : absolute.endsWith(extension)
        ? [absolute]
        : [];
  });
}
function transformApi(file) {
  const relative = path.relative(api, file).replaceAll(path.sep, "/");
  const isIndex = relative === "index.html";
  const url = new URL(
    isIndex ? "" : relative.replace(/index\.html$/, ""),
    config.site.pages.api.url,
  ).href;
  let html = readFileSync(file, "utf8")
    .replace(new RegExp(`${seoStart}[\\s\\S]*?${seoEnd}`, "g"), "")
    .replace(/<nav class="site-project-links"[\s\S]*?<\/nav>/g, "")
    .replace(/<aside class="site-pwa-update"[\s\S]*?<\/aside>/g, "");
  const originalTitle =
    html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? config.site.pages.api.title;
  const title = isIndex
    ? config.site.pages.api.title
    : originalTitle.replace(/ \| .*$/, "");
  const description = isIndex
    ? config.site.pages.api.description
    : `TypeScript API reference for ${title} in ${config.package.name}.`;
  const metadata = [
    seoStart,
    `<meta name="description" content="${escape(description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<link rel="icon" href="${config.site.basePath}images/${config.assets.faviconFile}" type="image/png">`,
    `<link rel="manifest" href="${config.pwa.manifestUrl}">`,
    `<meta name="theme-color" content="${config.site.theme.colorPrimary}" data-theme-color data-theme-color-light="${config.site.theme.colorLight}" data-theme-color-dark="${config.site.theme.colorDark}">`,
    `<meta property="og:type" content="website"><meta property="og:site_name" content="${config.brand.displayName}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}">`,
    `<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}">`,
    `<link rel="stylesheet" href="${config.site.basePath}assets/api.css"><script src="${config.site.basePath}assets/api.js" defer></script>`,
    seoEnd,
  ].join("");
  html = html
    .replace(/<title>[^<]*<\/title>/i, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/i, "")
    .replace(/<link rel="canonical"[^>]*>/i, "")
    .replace(/<html\b(?![^>]*data-bs-theme)/i, '<html data-bs-theme="light"')
    .replace("</head>", `${metadata}</head>`);
  const toolbar = '<div class="tsd-toolbar-contents container">';
  if (!html.includes(toolbar))
    throw new Error(`TypeDoc toolbar is missing in ${relative}.`);
  const navigation = `<nav class="site-project-links" aria-label="Project links"><a href="${config.site.pages.home.url}">Project home</a><a href="${config.site.pages.api.url}">API overview</a><a href="${config.urls.github}">GitHub</a><a href="${config.urls.npm}">npm package</a><span class="site-pwa-status" role="status" aria-live="polite" data-pwa-status></span><label class="theme-control"><span>Theme</span><select data-theme-select aria-label="Choose API documentation theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></nav>`;
  html = html
    .replace(toolbar, toolbar + navigation)
    .replace(
      /<div class="tsd-theme-toggle">[\s\S]*?<\/div>/,
      '<div class="tsd-theme-toggle"><label for="api-theme">Theme</label><select id="api-theme" data-theme-select><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div>',
    );
  if (isIndex) {
    html = html.replace(
      /(<div class="tsd-panel tsd-typography">)<h1(\b[^>]*)>([\s\S]*?)<\/h1>/i,
      "$1<h2$2>$3</h2>",
    );
  }
  if (isIndex && !/<h1\b/i.test(html))
    html = html.replace(/<h2\b/i, "<h1").replace(/<\/h2>/i, "</h1>");
  html = html.replace(
    "</body>",
    '<aside class="site-pwa-update" data-pwa-update hidden><span>A website update is available.</span><button type="button" data-pwa-update-now>Update now</button></aside></body>',
  );
  writeFileSync(file, html);
}
files(api, ".html").forEach(transformApi);

function apiAppShellAssets(html) {
  const allowedLinkRelations = new Set([
    "icon",
    "manifest",
    "modulepreload",
    "preload",
    "stylesheet",
  ]);
  const assets = new Set();
  for (const match of html.matchAll(/<(link|script|use)\b[^>]*>/gi)) {
    const tagName = match[1].toLowerCase();
    const attributes = Object.fromEntries(
      [...match[0].matchAll(/([:\w-]+)(?:=["']([^"']*)["'])?/g)].map(
        (attribute) => [attribute[1].toLowerCase(), attribute[2] ?? ""],
      ),
    );
    if (
      tagName === "link" &&
      !String(attributes.rel)
        .toLowerCase()
        .split(/\s+/)
        .some((relation) => allowedLinkRelations.has(relation))
    )
      continue;
    const reference = attributes.src || attributes.href;
    if (!reference) continue;
    const url = new URL(reference, config.site.pages.api.url);
    if (
      url.origin !== new URL(config.site.url).origin ||
      !url.pathname.startsWith(config.site.basePath)
    )
      continue;
    assets.add(`${url.pathname}${url.search}`);
  }
  return [...assets].sort();
}

const imageDirectory = path.join(docs, "images");
mkdirSync(imageDirectory, { recursive: true });
for (const [file] of config.pwa.icons)
  cpSync(path.join(root, "images", file), path.join(imageDirectory, file));
cpSync(
  path.join(root, "images", config.assets.faviconFile),
  path.join(imageDirectory, config.assets.faviconFile),
);

const manifest = {
  name: config.pwa.name,
  short_name: config.pwa.shortName,
  description: config.pwa.description,
  id: config.site.basePath,
  start_url: config.site.basePath,
  scope: config.site.basePath,
  display: "standalone",
  background_color: config.site.theme.colorLight,
  theme_color: config.site.theme.colorPrimary,
  icons: config.pwa.icons.map(([file, sizes, purpose]) => ({
    src: `${config.site.basePath}images/${file}`,
    sizes,
    type: "image/png",
    purpose,
  })),
};
writeFileSync(
  path.join(docs, "manifest.webmanifest"),
  JSON.stringify(manifest, null, 2) + "\n",
);
writeFileSync(
  path.join(docs, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${config.urls.sitemap}\n`,
);
const locations = [
  config.site.pages.home.url,
  config.site.pages.playground.url,
  config.site.pages.api.url,
];
writeFileSync(
  path.join(docs, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`,
);
writeFileSync(path.join(docs, ".nojekyll"), "");
const fingerprintHash = createHash("sha256");
for (const file of files(docs, "")
  .filter((file) => !file.endsWith("service-worker.js"))
  .sort()) {
  fingerprintHash.update(path.relative(docs, file));
  fingerprintHash.update(readFileSync(file));
}
const fingerprint = fingerprintHash
  .update(readFileSync(path.join(root, "site/service-worker.js")))
  .digest("hex")
  .slice(0, 16);
const worker = readFileSync(path.join(root, "site/service-worker.js"), "utf8")
  .replaceAll("__PWA_PROJECT_BASE__", config.site.basePath)
  .replaceAll("__PWA_CACHE_PREFIX__", config.pwa.cachePrefix)
  .replaceAll("__PWA_CACHE_VERSION__", fingerprint)
  .replaceAll(
    "__PWA_API_APP_SHELL__",
    JSON.stringify(
      apiAppShellAssets(readFileSync(path.join(api, "index.html"), "utf8")),
    ),
  );
writeFileSync(path.join(docs, "service-worker.js"), worker);
