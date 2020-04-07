#!/usr/bin/env node -r esm

import fs  from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import packageJson from './package.json'

const LIB_DR = path.resolve('lib')
const CMD = process.argv.slice(2).join(' ')
const MAIN_JS_FILE = 'main.js'
const MAIN_JS_DATA = `
require = require("esm")(module/*, options*/)
module.exports = require("./index.js")
`

// paths to exclude
const EXCLUDE = [
  'node_modules',
  'package-lock.json'
]

/**
 * Prepares the lib directory for distributting
 */
function prepare() {

  // ensure directory exists
  execSync(`mkdir -p ${LIB_DR}`)

  // delete any node_modules file
  EXCLUDE.forEach(p => execSync(`rm -fr ${path.join(LIB_DR, p)}`))

  // copy all the allowed files to the lib directory
  packageJson.files = packageJson.files.reduce((files, p) => {
    if (!p.match(/(lib|index\.js)/)) {
      fs.copyFileSync(path.resolve(p), path.resolve(path.join(LIB_DR, p)))
      files.push(p)
    }
    return files
  }, [
    '**/*.js',
    '**/*.ts'
  ])

  // write main entry files using esm
  fs.writeFileSync(path.resolve(path.join(LIB_DR, MAIN_JS_FILE)), MAIN_JS_DATA)

  // override entry files
  packageJson.main = MAIN_JS_FILE
  packageJson.module = 'index.js'
  packageJson.typings = 'index.d.ts'

  // clear all scripts
  packageJson.scripts = {}

  let data = JSON.stringify(packageJson, null, 2)

  // write new package.json for lib
  fs.writeFileSync(path.join(LIB_DR, 'package.json'), data)

  // print the resulting package.json
  console.log(data)
}

function main() {
  console.log(`Preparing package subfolder ${LIB_DR}\n`)
  prepare()

  // if a command was supplied execute it within the lib folder
  if (CMD) {
    let npm_cmd = `npm ${CMD}`

    console.log(`\nExecuting command: ${npm_cmd}\n`)

    process.chdir(LIB_DR)

    console.log(execSync(npm_cmd)+"\n")
    console.log("\nCompleted command\n")
  }
}

main()