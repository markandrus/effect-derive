import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'
import * as util from 'node:util'

import { Project } from 'ts-morph'

import { deriveBaseFunctor } from './deriveBaseFunctor'
import { deriveCovariant } from './deriveCovariant'
import { parseRegistryFlags } from './Registry'
import { deriveFoldable } from './deriveFoldable'
import { deriveTraversable } from './deriveTraversable'
import { deriveTypeLambda } from './deriveTypeLambda'

export * from './Corecursive'
export * from './Recursive'

export function main () {
  const {
    positionals: derivations,
    values: flags
  } = util.parseArgs({
    allowPositionals: true,
    options: {
      'for-type': { type: 'string' },
      discriminator: { type: 'string' },
      'in-file': { type: 'string' },
      'out-file': { type: 'string' },
      'covariant': { type: 'string', multiple: true },
      'foldable': { type: 'string', multiple: true },
      'traversable': { type: 'string', multiple: true },
      'type-lambda': { type: 'string', multiple: true }
    }
  })

  if (derivations.length === 0) {
    throw new Error(`At least one positional argument is required ("Covariant", "BaseFunctor", "Foldable", "Traversable" or "TypeLambda")`)
  }

  let inFilePath = flags['in-file']
  if (inFilePath == null) {
    throw new Error('--in-file is required')
  }

  const forType = flags['for-type']
  if (forType == null) {
    throw new Error('--for-type is required')
  }

  const discriminator = flags.discriminator

  const outFilePath = flags['out-file']
  if (outFilePath == null) {
    throw new Error('--out-file is required')
  }

  const [registries, outFile] = parseRegistryFlags(process.cwd(), inFilePath, outFilePath, {
    covariant: flags.covariant ?? [],
    foldable: flags.foldable ?? [],
    traversable: flags.traversable ?? [],
    typeLambda: flags['type-lambda'] ?? [],
  })

  const project = new Project()
  const inFile = project.addSourceFileAtPath(inFilePath)

  inFilePath = inFilePath.replace(/(\.d)?\.ts$/, '')
  inFilePath = './' + path.relative(path.dirname(outFilePath), inFilePath)

  const tyAliasDecl = inFile.getTypeAliasOrThrow(forType)

  for (const derivation of derivations) {
    switch (derivation) {
      case 'Covariant':
        outFile.merge(deriveCovariant(inFilePath, forType, discriminator, registries, tyAliasDecl))
        break
      case 'BaseFunctor':
        outFile.merge(deriveBaseFunctor(inFilePath, forType, discriminator, registries, tyAliasDecl))
        break
      case 'Foldable':
        outFile.merge(deriveFoldable(inFilePath, forType, discriminator, registries, tyAliasDecl))
        break
      case 'Traversable':
        outFile.merge(deriveTraversable(inFilePath, forType, discriminator, registries, tyAliasDecl))
        break
      case 'TypeLambda':
        outFile.merge(deriveTypeLambda(inFilePath, forType, registries.typeLambda, tyAliasDecl))
        break
      default:
        throw new Error(`I don\'t know how to derive "${derivation}"`)
    }
  }

  fs.writeFileSync(outFilePath, outFile.toString())
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    main()
  }
}
