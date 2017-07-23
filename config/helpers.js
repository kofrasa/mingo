import fs from 'fs'

export const MODULE = 'mingo'

const VERSION = fs.readFileSync('VERSION').toString()

export function version () {
  return {
    name: 'version',
    transformBundle (code) {
      return code.replace(/VERSION\s+=\s+(['"])[\d\.]+\1/, `VERSION = '${VERSION}'`)
    }
  }
}

export const HEADER = fs.readFileSync(__dirname + '/../templates/header.txt').toString()
  .replace('@YEAR', new Date().getFullYear())
  .replace('@VERSION', VERSION)