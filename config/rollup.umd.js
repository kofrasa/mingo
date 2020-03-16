import babel from 'rollup-plugin-babel'
import config from './rollup.es'

const output = config.output[0]

export default Object.assign({}, config, {
  output: [
    Object.assign({}, output, {
      file: `dist/${output.name}.js`,
      format: 'umd'
    })
  ],
  plugins: config.plugins.concat([
    babel({
      exclude: 'node_modules/**'
    })
  ])
});