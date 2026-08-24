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
  expect(npmIgnore).toMatch(/^scripts\/$/m);
});

test("the package publishes React 19 as external runtime dependencies", () => {
  const packageJson = require("../package.json");
  const rollupConfig = fs.readFileSync(
    path.join(projectRoot, "scripts/rollup.config.mjs"),
    "utf8",
  );

  expect(packageJson.dependencies).toEqual({
    react: "^19.0.0",
    "react-dom": "^19.0.0",
  });
  expect(packageJson.peerDependencies).toBeUndefined();
  expect(packageJson.devDependencies.react).toBeUndefined();
  expect(packageJson.devDependencies["react-dom"]).toBeUndefined();
  for (const external of [
    "react",
    "react-dom",
    "react-dom/client",
    "react/jsx-runtime",
  ]) {
    expect(rollupConfig).toContain(`"${external}"`);
  }
  expect(packageJson.exports["."]).toEqual({
    types: "./lib/index.d.ts",
    import: "./lib/index.esm.mjs",
    require: "./lib/index.cjs.js",
    default: "./lib/index.esm.mjs",
  });
  expect(packageJson.files).toEqual(["lib", "README.md", "LICENSE"]);
});
