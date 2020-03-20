import babel from 'rollup-plugin-babel'
import fs from 'fs'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import packageDetails from './package.json'


const MODULE = 'mingo'
const BANNER = fs.readFileSync(`${__dirname}/templates/header.txt`, 'utf8')
  .replace('@YEAR', new Date().getFullYear())
  .replace('@VERSION', packageDetails.version)

export default {
  input: './index.js',
  output: [
    {
      file: `dist/${MODULE}.js`,
      banner: BANNER,
      format: 'umd',
      name: MODULE,
    }
  ],
  plugins: [
    resolve({
      mainFields: ['module', 'main']
    }),
    commonjs(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};