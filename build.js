const fs = require('fs')
const path = require('path')
const cp = require('child_process')
const packageJson = require('./package.json')

const LIB_DIR = path.resolve('lib')
const CMD = process.argv.slice(2).join(' ')

// .npmignore
const NPM_IGNORE = [
  '.*',
  '*.tgz',
  'node_modules',
  'package-lock.json'
]

/**
 * Create module in LIB_DIR
 */
function createModule() {

  console.log("Creating module at " + LIB_DIR)

  // ensure directory exists
  if (!fs.existsSync(LIB_DIR)) fs.mkdirSync(LIB_DIR)

  // write ignore file
  fs.writeFileSync(path.join(LIB_DIR, '.npmignore'), NPM_IGNORE.join('\n'))

  // copy all the allowed files to the lib directory
  packageJson.files = ["LICENSE", "README.md", "CHANGELOG.md"].reduce((files, p) => {
    fs.copyFileSync(path.resolve(p), path.join(LIB_DIR, p))
    files.push(p)
    return files
  }, [
    '**/*.js',
    '**/*.ts'
  ])

  // override entry files
  packageJson.main = 'index.js'
  packageJson.module = packageJson.main
  packageJson.typings = 'index.d.ts'

  // clear all scripts
  packageJson.scripts = {}
  packageJson.devDependencies = {}

  let data = JSON.stringify(packageJson, null, 2)

  // write new package.json for lib
  fs.writeFileSync(path.join(LIB_DIR, 'package.json'), data)
}

function main() {
  createModule()

  if (CMD) {
    // execute within lib dir
    let npm_cmd = "npm " + CMD

    console.log("\nExecuting command:", npm_cmd, "\n")

    // execute command
    cp.execSync(npm_cmd, { cwd: LIB_DIR, env: process.env, stdio: 'inherit' })

    console.log("\nCompleted command\n")

    // if we created a tar file, copy to parent directory
    let tarball = packageJson.name + '-' + packageJson.version + '.tgz'
    let tarballPath = path.join(LIB_DIR, tarball)
    if (fs.existsSync(tarballPath)) {
      console.log("Copying", tarball, "to correct folder")
      fs.renameSync(tarballPath, path.join(path.dirname(LIB_DIR), tarball))
    }
  }
}

main()