import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'
import * as util from 'node:util'

import { Node, Project } from 'ts-morph'

import { deriveBaseFunctor } from './deriveBaseFunctor.js'
import { deriveCovariant } from './deriveCovariant.js'
import { OutFile } from './OutFile.js'

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
      'out-file': { type: 'string' }
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

  const project = new Project()
  const inFile = project.addSourceFileAtPath(inFilePath)

  inFilePath = inFilePath.replace(/(\.d)?\.ts$/, '')
  inFilePath = './' + path.relative(path.dirname(outFilePath), inFilePath)

  let outFile: OutFile | undefined
  for (const node of inFile.getChildSyntaxListOrThrow().getChildren()) {
    if (Node.isTypeAliasDeclaration(node)) {
      if (node.getName() === forType) {
        outFile = action === 'Covariant'
          ? deriveCovariant(inFilePath, forType, discriminator, node)
          : deriveBaseFunctor(inFilePath, forType, discriminator, node)
        break
      }
    }
  }

  if (outFile == null) {
    throw new Error(`Failed to find a type alias named "${forType}"`)
  }

  fs.writeFileSync(outFilePath, outFile.toString())
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    main()
  }
}
