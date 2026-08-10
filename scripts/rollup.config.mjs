import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "lib/index.cjs.js",
      format: "cjs",
    },
    {
      file: "lib/index.esm.mjs",
      format: "esm",
    },
  ],
  plugins: [typescript({ tsconfig: "./tsconfig.build.json" })],
  external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
};
