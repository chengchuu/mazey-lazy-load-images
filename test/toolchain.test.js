const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

test("Jest discovers tests only from the source test directory", () => {
  const config = require("../jest.config.cjs");

  expect(config.testMatch).toEqual(["<rootDir>/test/**/*.test.{js,ts,tsx}"]);
  expect(config.testPathIgnorePatterns).toEqual(
    expect.arrayContaining(["/dist/", "/docs/", "/lib/", "/node_modules/"]),
  );
});

test("generated and development-only files stay out of the npm package", () => {
  const npmIgnore = fs.readFileSync(
    path.join(projectRoot, ".npmignore"),
    "utf8",
  );

  expect(npmIgnore).toMatch(/^dist\/$/m);
  expect(npmIgnore).toMatch(/^docs\/$/m);
  expect(npmIgnore).toMatch(/^\.husky\/$/m);
  expect(npmIgnore).toMatch(/^eslint\.config\.mjs$/m);
  expect(npmIgnore).toMatch(/^jest\.config\.cjs$/m);
  expect(npmIgnore).toMatch(/^rollup\.config\.mjs$/m);
});

test("the development runtime and package manager stay pinned", () => {
  const packageJson = require("../package.json");
  const nvmVersion = fs
    .readFileSync(path.join(projectRoot, ".nvmrc"), "utf8")
    .trim();

  expect(packageJson.engines.node).toBe(">=22");
  expect(packageJson.packageManager).toBe("pnpm@10.26.2");
  expect(nvmVersion).toBe("22");
});

test("the package publishes React 19 as external peer dependencies", () => {
  const packageJson = require("../package.json");

  expect(packageJson.version).toBe("2.0.0");
  expect(packageJson.dependencies).toBeUndefined();
  expect(packageJson.peerDependencies).toEqual({
    react: "^19.0.0",
    "react-dom": "^19.0.0",
  });
  expect(packageJson.exports["."]).toEqual({
    types: "./lib/index.d.ts",
    import: "./lib/index.esm.mjs",
    require: "./lib/index.cjs.js",
    default: "./lib/index.esm.mjs",
  });
  expect(packageJson.files).toEqual(["lib", "README.md", "LICENSE"]);
});
