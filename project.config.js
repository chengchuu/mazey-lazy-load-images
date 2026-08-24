const { deepFreeze, parseGitHubRepository } = require("mazey");
const pkg = require("./package.json");

const shortName = "Lazy Images";
const siteUrl = new URL(pkg.homepage);
const basePath = siteUrl.pathname.endsWith("/")
  ? siteUrl.pathname
  : `${siteUrl.pathname}/`;
const repository = parseGitHubRepository(pkg.repository.url);
const githubUrl = repository.url;
const npmUrl = `https://www.npmjs.com/package/${pkg.name}`;
const pages = {
  home: {
    title: `${pkg.name} - Responsive React Image Galleries`,
    description:
      "Render responsive, lazy-loaded image galleries with React 19, TypeScript, IntersectionObserver, placeholders, fallbacks, and retry controls.",
    url: siteUrl.href,
  },
  playground: {
    title: `${pkg.name} Playground - Try Lazy Image Galleries`,
    description:
      "Try the public mazey-lazy-load-images API with local images, responsive columns, lazy loading, error feedback, updates, and cleanup.",
    url: new URL("playground/", siteUrl).href,
  },
  api: {
    title: `${pkg.name} API Documentation`,
    description:
      "TypeScript API documentation for LazyImageGallery, mountLazyImageGallery, gallery configuration, events, labels, and controller methods.",
    url: new URL("api/", siteUrl).href,
  },
};

module.exports = deepFreeze({
  package: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    installCommand: `npm install ${pkg.name}`,
  },
  brand: { displayName: pkg.name, shortName },
  urls: {
    github: githubUrl,
    npm: npmUrl,
    license: `${githubUrl}/blob/main/LICENSE`,
    sitemap: new URL("sitemap.xml", siteUrl).href,
  },
  assets: {
    faviconFile: "logo-32x32.png",
    logoFile: "logo-192x192.png",
  },
  site: {
    url: siteUrl.href,
    basePath,
    pages,
    theme: {
      storageKey: `${pkg.name}-theme`,
      colorPrimary: "#5b3fd6",
      colorLight: "#f7f8fc",
      colorDark: "#0d1220",
    },
  },
  seo: {
    software: {
      "@type": "SoftwareSourceCode",
      name: pkg.name,
      description: pages.home.description,
      url: pages.home.url,
      codeRepository: githubUrl,
      downloadUrl: npmUrl,
      license: `${githubUrl}/blob/main/LICENSE`,
      programmingLanguage: "TypeScript",
    },
  },
  pwa: {
    name: pkg.name,
    shortName,
    description: `Website, playground, and API documentation for ${pkg.name}.`,
    manifestUrl: `${basePath}manifest.webmanifest`,
    serviceWorkerUrl: `${basePath}service-worker.js`,
    cachePrefix: `${pkg.name}-site-`,
    icons: [
      ["logo-192x192.png", "192x192", "any"],
      ["logo-512x512.png", "512x512", "any"],
      ["logo-maskable-512x512.png", "512x512", "maskable"],
    ],
  },
});
