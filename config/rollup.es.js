import fs from 'fs'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'


const MODULE = 'mingo'
const VERSION = fs.readFileSync(__dirname +'/../VERSION').toString().trim()
const BANNER = fs.readFileSync(__dirname + '/../templates/header.txt').toString()
  .replace('@YEAR', new Date().getFullYear())
  .replace('@VERSION', VERSION)


function version () {
  return {
    name: 'version',
    transformBundle (code) {
      return code.replace(/VERSION\s+=\s+(['"])[\d\.]+\1/, `VERSION = '${VERSION}'`)
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