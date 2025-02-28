import { Project, SyntaxKind } from 'ts-morph'

export function parseTypeWithHole(typ: string, expectHole: boolean): [name: string, holeIndex: number] {
  const srcFile = new Project().createSourceFile('index.ts', `type ${typ} = { x: ${typ} }`)
  const tyAlias = srcFile.getTypeAliases()[0]
  const tyNode = tyAlias
    .getTypeNodeOrThrow()
    .asKindOrThrow(SyntaxKind.TypeLiteral)
    .getProperty('x')!
    .getTypeNodeOrThrow()
    .asKindOrThrow(SyntaxKind.TypeReference)

  const name = tyNode.getTypeName().print()

  let holeIndex = -1

  if (expectHole) {
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
  }

  return [name, holeIndex]
}
