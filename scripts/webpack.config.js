const path = require("node:path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const config = require("../project.config.js");

module.exports = (env = {}) => {
  const production = env.pages === true;
  const publicPath = production ? config.site.basePath : "/";
  const pwaEnabled = production;
  const parameters = (page, jsonLd) => ({
    displayName: config.brand.displayName,
    faviconUrl: `${publicPath}images/${config.assets.faviconFile}`,
    githubUrl: config.urls.github,
    installCommand: config.package.installCommand,
    jsonLd: JSON.stringify(jsonLd),
    logoUrl: `${publicPath}images/${config.assets.logoFile}`,
    manifestUrl: pwaEnabled ? config.pwa.manifestUrl : null,
    npmUrl: config.urls.npm,
    page,
  });
  const runtime = {
    installCommand: config.package.installCommand,
    packageName: config.package.name,
    themeStorageKey: config.site.theme.storageKey,
    pwa: {
      appName: config.brand.displayName,
      enabled: pwaEnabled,
      scope: config.site.basePath,
      serviceWorkerUrl: config.pwa.serviceWorkerUrl,
    },
  };
  return {
    mode: production ? "production" : "development",
    entry: {
      shared: [
        path.resolve(__dirname, "../site/shared.ts"),
        path.resolve(__dirname, "../images/logo-32x32.png"),
        path.resolve(__dirname, "../images/logo-192x192.png"),
      ],
      home: {
        import: path.resolve(__dirname, "../site/index.ts"),
        dependOn: "shared",
      },
      playground: {
        import: path.resolve(__dirname, "../examples/example.tsx"),
        dependOn: "shared",
      },
      api: path.resolve(__dirname, "../site/api.ts"),
    },
    output: {
      clean: true,
      filename: "assets/[name].js",
      path: path.resolve(__dirname, "../dist-dev"),
      publicPath,
    },
    devServer: {
      port: 8080,
      host: "0.0.0.0",
      static: [
        { directory: path.resolve(__dirname, "../dist-dev") },
        { directory: path.resolve(__dirname, "../docs") },
      ],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              compilerOptions: { declaration: false, declarationMap: false },
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          sideEffects: true,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.(png|jpe?g)$/i,
          type: "asset/resource",
          generator: { filename: "images/[name][ext]" },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        __SITE_RUNTIME_CONFIG__: JSON.stringify(runtime),
      }),
      new MiniCssExtractPlugin({ filename: "assets/[name].css" }),
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: path.resolve(__dirname, "../site/index.html"),
        chunks: ["shared", "home"],
        templateParameters: parameters(config.site.pages.home, {
          "@context": "https://schema.org",
          ...config.seo.software,
        }),
      }),
      new HtmlWebpackPlugin({
        filename: "playground/index.html",
        template: path.resolve(__dirname, "../examples/playground.html"),
        chunks: ["shared", "playground"],
        templateParameters: parameters(config.site.pages.playground, {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: config.site.pages.playground.title,
          description: config.site.pages.playground.description,
          url: config.site.pages.playground.url,
        }),
      }),
    ],
    resolve: { extensions: [".tsx", ".ts", ".js"] },
    performance: { maxAssetSize: 600000, maxEntrypointSize: 600000 },
  };
};
