import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'
import * as util from 'node:util'

import { Node, Project, SyntaxKind, TypeNode } from 'ts-morph'

import { deriveBaseFunctor } from './deriveBaseFunctor'
import { CovariantRegistry, deriveCovariant } from './deriveCovariant'
import { OutFile } from './OutFile'

export * from './Corecursive'
export * from './Recursive'

function parseCovariantType (typ: string): [name: string, holeIndex: number] {
  const srcFile = new Project().createSourceFile('index.ts', `type ${typ} = { x: ${typ} }`)
  const tyAlias = srcFile.getTypeAliases()[0]
  const tyNode = tyAlias.getTypeNodeOrThrow().asKindOrThrow(SyntaxKind.TypeLiteral).getProperty('x')!.getTypeNodeOrThrow().asKindOrThrow(SyntaxKind.TypeReference)

  const name = tyNode.getTypeName().print()

  let holeIndex: number | undefined
  let holeCount = 0
  const tyArgs = tyNode.getTypeArguments()
  for (let i = 0; i < tyArgs.length; i++) {
    const tyArg = tyArgs[i]
    if (tyArg.print() === '_') {
      holeIndex = i
      holeCount++
      break
    }
  }

  if (holeIndex == null || holeCount !== 1) {
    throw new Error(`Type \`${typ}\` should have a singe hole; found ${holeCount}`)
  }

  return [name, holeIndex]
}

function parseCovariantFlags (cwd: string, inFilePath: string, outFilePath: string, flags: string[]): [CovariantRegistry, OutFile] {
  const registry: CovariantRegistry = new Map()
  const outFile = new OutFile()

  for (const flag of flags) {
    const parts = flag.split('#')
    if (parts.length < 2) {
      throw new Error('Failed to parse --covariant flag: expected at least an import path and a type name')
    } else if (parts.length > 3) {
      throw new Error('Failed to parse --covariant flag: expected at most an import path, an import name, and a type name')
    }

    let importPath: string = parts[0]
    let importName: string | null = null
    let tyName: string

    if (parts.length === 2) {
      tyName = parts[1]
    } else {
      importName = parts[1]
      tyName = parts[2]
    }

    const [name, holeIndex] = parseCovariantType(tyName)

    // NOTE(mroberts): We could add support for repeating types with different
    // holes; however, I don't want to suport that right now.
    if (registry.has(name)) {
      throw new Error(`--covariant flag for type name ${tyName} was already provided`)
    }
    registry.set(name, [holeIndex, `${name}Covariant.map`])

    if (!importPath.startsWith('.')) {
      if (importName == null) {
        outFile.addPackageDefaultImport(importPath, name + 'Covariant')
      } else {
        outFile.addPackageImport(importPath, importName, name + 'Covariant')
      }
    } else {
      let absPath: string | undefined
      for (let pathToTry of [outFilePath, inFilePath, cwd]) {
        pathToTry = path.resolve(path.join(pathToTry, importPath))

        if (fs.existsSync(pathToTry)) {
          absPath = pathToTry
          break
        }

        const suffixes = ['.cjs', '.mjs', '.js', '.cts', '.mts', '.ts']
        for (const suffix of suffixes) {
          if (pathToTry.endsWith(suffix)) {
            pathToTry = pathToTry.slice(0, pathToTry.length - suffix.length)
          }
        }

        for (const suffix of suffixes) {
          const pathToTryWithSuffix = pathToTry + suffix
          if (fs.existsSync(pathToTryWithSuffix)) {
            absPath = pathToTry
            break
          }
        }
      }

      if (absPath == null) {
        throw new Error(`Could not resolve import path: ${importPath}`)
      }

      importPath = './' + path.relative(path.dirname(outFilePath), absPath)

      if (importName == null) {
        outFile.addLocalDefaultImport(importPath, name + 'Covariant')
      } else {
        outFile.addLocalImport(importPath, importName, name + 'Covariant')
      }
    }
  }

  return [registry, outFile]
}

export function main () {
  const {
    positionals,
    values
  } = util.parseArgs({
    allowPositionals: true,
    options: {
      'for-type': { type: 'string' },
      discriminator: { type: 'string' },
      'in-file': { type: 'string' },
      'out-file': { type: 'string' },
      'covariant': { type: 'string', multiple: true }
    }
  })

  if (positionals.length !== 1 || (positionals[0] !== 'Covariant' && positionals[0] !== 'BaseFunctor')) {
    throw new Error('Expected exactly one positional argument "Covariant" or "BaseFunctor"')
  }
  const action: 'Covariant' | 'BaseFunctor' = positionals[0]

  let inFilePath = values['in-file']
  if (inFilePath == null) {
    throw new Error('--in-file is required')
  }

  const forType = values['for-type']
  if (forType == null) {
    throw new Error('--for-type is required')
  }

  const discriminator = values.discriminator

  const outFilePath = values['out-file']
  if (outFilePath == null) {
    throw new Error('--out-file is required')
  }

  const [registry, imports] = parseCovariantFlags(process.cwd(), inFilePath, outFilePath, values['covariant'] ?? [])

  const project = new Project()
  const inFile = project.addSourceFileAtPath(inFilePath)

  inFilePath = inFilePath.replace(/(\.d)?\.ts$/, '')
  inFilePath = './' + path.relative(path.dirname(outFilePath), inFilePath)

  let outFile: OutFile | undefined
  for (const node of inFile.getChildSyntaxListOrThrow().getChildren()) {
    if (Node.isTypeAliasDeclaration(node)) {
      if (node.getName() === forType) {
        outFile = action === 'Covariant'
          ? deriveCovariant(inFilePath, forType, discriminator, registry, node)
          : deriveBaseFunctor(inFilePath, forType, discriminator, registry, node)
        break
      }
    }
  }

  if (outFile == null) {
    throw new Error(`Failed to find a type alias named "${forType}"`)
  }

  fs.writeFileSync(outFilePath, outFile.merge(imports).toString())
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    main()
  }
}
