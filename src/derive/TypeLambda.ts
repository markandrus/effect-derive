import type { TypeAliasDeclaration } from 'ts-morph'

import { OutFile } from '../util/OutFile.ts'
import type { Registry } from '../util/Registry.ts'

export default function (
  inFilePath: string | undefined,
  forType: string,
  registry: Registry,
  node: TypeAliasDeclaration
): OutFile {
  const outFile = new OutFile()

  const tyParams = node.getTypeParameters()
  if (tyParams.length > 3) {
    throw new Error(
      "At most 3 type parameters are supported when deriving TypeLambda, due to limitations in effect's HKT encoding"
    )
  }

  // In Haskell-style, we take the rightmost type parameter to be the "hole".
  const holeIndex = tyParams.length - 1
  registry.set(forType, [holeIndex, ''])

  let typeLambdaParams = ''
  if (tyParams.length > 0) {
    typeLambdaParams = '<'
    for (let i = tyParams.length - 2; i >= 0; i--) {
      typeLambdaParams += `this["Out${i + 1}"], `
    }
    if (tyParams.length > 0) {
      typeLambdaParams += 'this["Target"]>'
    }
  }

  outFile.addPackageImport('effect/HKT', 'TypeLambda', true)

  if (inFilePath != null) outFile.addLocalImport(inFilePath, forType, true)

  return outFile.addDeclarations(`\
export interface ${forType}TypeLambda extends TypeLambda {
  readonly type: ${forType}${typeLambdaParams}
}

`)
}
