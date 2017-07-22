import babel from 'rollup-plugin-babel'
import config from './rollup.es6'

const MODULE = config.moduleName

export default Object.assign({}, config, {
  dest: `dist/${MODULE}.js`,
  format: 'umd',
  plugins: config.plugins.concat([
    babel({
      exclude: 'node_modules/**'
    })
  ])
});