import { Node, type TypeAliasDeclaration, type TypeNode } from 'ts-morph'

import { OutFile } from '../OutFile'
import { type Registries } from '../Registry'
import deriveCovariant from './Covariant'
import deriveFoldable from './Foldable'
import deriveTraversable from './Traversable'
import deriveTypeLambda from './TypeLambda'

export default function (inFilePath: string, forType: string, discriminator: string | undefined, registries: Registries, node: TypeAliasDeclaration, extrasToDerive: Set<string>): OutFile {
  const outFile = new OutFile()

  const tyParams = node.getTypeParameters()
  if (tyParams.length > 2) {
    throw new Error('At most 2 type parameters are supported when deriving baase functor, due to limitations in effect\'s HKT encoding')
  }

  const tA = tyParams.length > 0 ? 'A' : 'never'
  const tE = tyParams.length > 1 ? 'E' : 'never'
  const freeTyParams = tA !== 'never' || tE !== 'never'
    ? `<${tE !== 'never' ? `${tE}, ` : ''}${tA}>`
    : ''

  const tyParamsSet = new Set(tyParams.map(tyParam => tyParam.getText()))
  let newTyParamName = 'X'
  for (let i = 0; tyParamsSet.has(newTyParamName); i++) {
    newTyParamName = `X${i + 1}`
  }

  // NOTE(mroberts): Do this before mutating `node`.
  if (!registries.typeLambda.has(forType)) {
    outFile.merge(deriveTypeLambda(inFilePath, forType, registries.typeLambda, node))
  }

  node.insertTypeParameter(tyParams.length, {
    name: newTyParamName
  })

  const tyNode = node.getTypeNodeOrThrow()
  let tyNodes = [tyNode]
  if (Node.isUnionTypeNode(tyNode)) {
    if (discriminator == null) {
      throw new Error('--discriminator is required for union types')
    }
    tyNodes = tyNode.getTypeNodes()
  } else if (!Node.isTypeLiteral(tyNode)) {
    throw new Error(`Type alias "${forType}" must be a union or type literal`)
  }
  handleTypeNodes(forType, newTyParamName, tyNodes)

  node.rename(forType + 'F', {})

  outFile.addDeclarations(node.print() + '\n\n')

  outFile
    .merge(deriveTypeLambda(undefined, forType + 'F', registries.typeLambda, node))
    .merge(deriveCovariant(undefined, forType + 'F', discriminator, registries, node))

  if (extrasToDerive.has('Foldable')) {
    outFile.merge(deriveFoldable(undefined, forType + 'F', discriminator, registries, node))
  }

  if (extrasToDerive.has('Traversable')) {
    outFile.merge(deriveTraversable(undefined, forType + 'F', discriminator, registries, node))
  }

  // TODO(mroberts): We should publish these, so that we don't have to use relative
  // paths, which won't work in other projects.
  if (extrasToDerive.has('Recursive')) {
    outFile
      .addLocalImport('../typeclass/Recursive', 'Recursive', 'R', true)
      .addDeclarations(`\
export const Recursive: ${freeTyParams !== '' ? `${freeTyParams}() => ` : ''}R<${forType}TypeLambda, ${forType}FTypeLambda, never, never, ${tE}, ${tA}, never, ${tE}, ${tA}> = ${freeTyParams !== '' ? '() => (' : ''}{
  F: Covariant,
  project: t => t
}${freeTyParams !== '' ? ')' : ''}

`)
  }

  if (extrasToDerive.has('Corecursive')) {
    outFile
      .addLocalImport('../typeclass/Corecursive', 'Corecursive', 'C', true)
      .addDeclarations(`\
export const Corecursive: ${freeTyParams !== '' ? `${freeTyParams}() => ` : ''}C<${forType}TypeLambda, ${forType}FTypeLambda, never, never, ${tE}, ${tA}, never, ${tE}, ${tA}> = ${freeTyParams !== '' ? '() => (' : ''}{
  F: Covariant,
  embed: t => t
}${freeTyParams !== '' ? ')' : ''}

`)
  }

  return outFile
}

function handleTypeNodes (forType: string, tyParam: string, tyNodes: TypeNode[]): void {
  for (const tyNode of tyNodes) {
    handleTypeNode(forType, tyParam, tyNode)
  }
}

function handleTypeNode (forType: string, tyParam: string, tyNode: TypeNode): void {
  if (!Node.isTypeLiteral(tyNode)) {
    throw new Error(`Every member of the union type "${forType}" must be a TypeLiteral`)
  }

  for (const member of tyNode.getMembers()) {
    if (!Node.isPropertySignature(member)) {
      throw new Error(`Expected a PropertySignature; got ${member.getKindName()}`)
    }

    const memberValue = member.getTypeNodeOrThrow()

    if (Node.isTypeReference(memberValue)) {
      if (memberValue.getTypeName().getText() === forType) {
        memberValue.replaceWithText(tyParam)
      }
    }
  }
}
