import * as fs from 'node:fs'
import * as path from 'node:path'

const suffixes = ['.cjs', '.mjs', '.js', '.cts', '.mts', '.ts']

export function resolveRelativePath (cwd: string, inFilePath: string, outFilePath: string, importPath: string): string {
  let absPath: string | undefined
  for (let pathToTry of [outFilePath, inFilePath, cwd]) {
    pathToTry = path.resolve(path.join(pathToTry, importPath))

    if (fs.existsSync(pathToTry)) {
      absPath = pathToTry
      break
    }

    for (const suffix of suffixes) {
      if (pathToTry.endsWith(suffix)) {
        pathToTry = pathToTry.slice(0, pathToTry.length - suffix.length)
        break
      }
    }

    for (const suffix of suffixes) {
      const pathToTryWithSuffix = pathToTry + suffix
      if (fs.existsSync(pathToTryWithSuffix)) {
        absPath = pathToTryWithSuffix
        break
      }
    }
  }

  if (absPath == null) {
    throw new Error(`Could not resolve import path: ${importPath}`)
  }

  return './' + path.relative(path.dirname(outFilePath), absPath)
}
