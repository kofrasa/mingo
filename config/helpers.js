import fs from 'fs'

export const MODULE = 'mingo'

const VERSION = fs.readFileSync('VERSION').toString()

export function version () {
  return {
    name: 'version',
    transformBundle (code) {
      return code.replace(/VERSION\s+=\s+(['"])@VERSION\1/, `VERSION = '${VERSION}'`)
    }
  }
}

const contents = fs.readFileSync(__dirname + '/../template/header.txt').toString()
export const HEADER = contents.replace('@YEAR', new Date().getFullYear()).replace('@VERSION', VERSION)