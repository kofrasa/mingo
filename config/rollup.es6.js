
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import { HEADER, MODULE, version } from './helpers.js'

export default {
  banner: HEADER,
  entry: 'lib/index.js',
  dest: `dist/${MODULE}-es6.js`,
  format: 'es',
  moduleName: MODULE,
  plugins: [
    version(),
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs()
  ]
};