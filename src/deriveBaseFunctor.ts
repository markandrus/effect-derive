import { Node, type TypeAliasDeclaration, type TypeNode } from 'ts-morph'

import { CovariantRegistry, deriveCovariant } from './deriveCovariant'
import { OutFile } from './OutFile'

export function deriveBaseFunctor (_inFilePath: string, forType: string, discriminator: string | undefined, registry: CovariantRegistry, node: TypeAliasDeclaration): OutFile {
  const outFile = new OutFile()

  const tyParams = node.getTypeParameters()
  if (tyParams.length > 3) {
    throw new Error('At most 3 type parameters are supported when deriving functor, due to limitations in effect\'s HKT encoding')
  }

  const tyParamsSet = new Set(tyParams.map(tyParam => tyParam.getText()))
  let newTyParamName = 'X'
  for (let i = 0; tyParamsSet.has(newTyParamName); i++) {
    newTyParamName = `X${i + 1}`
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

  return outFile.merge(deriveCovariant(undefined, forType + 'F', discriminator, registry, node))
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