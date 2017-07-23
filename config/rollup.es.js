import { HEADER, MODULE, version } from './helpers.js'

export default {
  banner: HEADER,
  entry: 'lib/index.js',
  dest: `dist/${MODULE}.es6.js`,
  format: 'es',
  moduleName: MODULE,
  plugins: [
    version()
  ]
};