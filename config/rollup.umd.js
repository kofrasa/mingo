import babel from 'rollup-plugin-babel'
import config from './rollup.es'

export default Object.assign({}, config, {
  dest: `dist/${config.moduleName}.js`,
  format: 'umd',
  plugins: config.plugins.concat([
    babel({
      exclude: 'node_modules/**'
    })
  ])
});