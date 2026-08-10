import { DEFAULT_EXTENSIONS } from '@babel/core';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'lib/index.cjs.js',
      format: 'cjs',
    },
    {
      file: 'lib/index.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    typescript(),
    nodeResolve(),
    commonjs({
      include: /node_modules/,
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      extensions: [...DEFAULT_EXTENSIONS, '.ts'],
    }),
  ],
  external: ['mazey'],
};
