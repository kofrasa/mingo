import fs from 'fs'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import packageDetails from '../package.json'


const MODULE = 'mingo'
const BANNER = fs.readFileSync(`${__dirname}/../templates/header.txt`, 'utf8')
  .replace('@YEAR', new Date().getFullYear())
  .replace('@VERSION', packageDetails.version)

function version () {
  return {
    name: 'version',
    transformBundle (code) {
      return code.replace(/VERSION\s+=\s+(['"])[\d\.]+\1/, `VERSION = '${packageDetails.version}'`)
    }
  }
}

export default {
  banner: BANNER,
  entry: 'index.js',
  dest: `dist/${MODULE}.es6.js`,
  format: 'es',
  moduleName: MODULE,
  plugins: [
    version(),
    resolve({
      main: true,
      module: true
    }),
    commonjs()
  ]
};
