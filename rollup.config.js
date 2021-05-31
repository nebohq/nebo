import { babel } from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import { optimizeLodashImports } from '@optimize-lodash/rollup-plugin';
import neboPackage from './package.json';

const base = {
  input: 'src/index.js',
  plugins: [
    babel({ babelHelpers: 'runtime' }),
    optimizeLodashImports(),
    replace({
      __ENV__: JSON.stringify('production'),
      __NEBO_VERSION__: JSON.stringify(neboPackage.version),
    }),
  ],
};

const esm = {
  output: {
    dir: 'lib/esm',
    format: 'esm',
  },
  ...base,
};

const cjs = {
  output: {
    dir: 'lib/cjs',
    format: 'cjs',
  },
  ...base,
};

export default [esm, cjs];
