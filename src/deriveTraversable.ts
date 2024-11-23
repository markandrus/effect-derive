import { type TypeAliasDeclaration } from 'ts-morph'

import { OutFile } from './OutFile'
import { type Registry } from './Registry'

export function deriveTraversable (inFilePath: string | undefined, forType: string, discriminator: string | undefined, registry: Registry, node: TypeAliasDeclaration): OutFile {
  const outFile = new OutFile()
  throw new Error('Not yet implemented')
}
