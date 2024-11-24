import { Node, type TypeNode, type TypeAliasDeclaration } from 'ts-morph'

import { deriveTypeLambda } from './deriveTypeLambda'
import { OutFile } from './OutFile'
import { type Registries } from './Registry'
import { createRegistryMatcher, RegistryMatcher } from './RegistryMatcher'

const tyParamPlaceholders = ['C', 'D']

export function deriveFoldable (inFilePath: string | undefined, forType: string, discriminator: string | undefined, registries: Registries, node: TypeAliasDeclaration): OutFile {
  const outFile = new OutFile()

  const tyParams = node.getTypeParameters()
  if (tyParams.length < 1) {
    throw new Error('At least one type parameter is required to derive Foldable')
  } else if (tyParams.length > 3) {
    throw new Error('At most 3 type parameters are supported when deriving Foldable, due to limitations in effect\'s HKT encoding')
  }

  // In Haskell-style, we take the rightmost type parameter to be the "hole".
  const holeIndex = tyParams.length - 1
  const tyParam = tyParams[holeIndex]
  registries.foldable.set(forType, [holeIndex, 'reduce'])

  const matcher = createRegistryMatcher(registries.foldable)

  let freeTyParams = ''
  for (let i = tyParams.length - 2; i >= 0; i--) {
    freeTyParams += `${tyParamPlaceholders[i]}${i > 0 ? ', ' : ''}`
  }

  const freeTyParamsPrefix = freeTyParams === '' ? '' : `${freeTyParams}, `
  freeTyParams = freeTyParams === '' ? '' : `<${freeTyParams}>`

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
  const switchStmt = handleTypeNodes(matcher, forType, discriminator, tyParam.getName(), tyNodes)

  outFile
    .addPackageAsteriskImport('@effect/typeclass/Foldable', 'foldable')
    .addPackageImport('effect/Function', 'dual')

  if (!registries.typeLambda.has(forType)) {
    outFile.merge(deriveTypeLambda(inFilePath, forType, registries.typeLambda, node))
  }

  if (inFilePath != null) outFile.addLocalImport(inFilePath, forType, true)

  // TODO(mroberts): Maybe OutFile needs to track which type lambdas have been declared, too?
  return outFile.addDeclarations(`\
export const ${forType[0].toLowerCase() + forType.slice(1)}Foldable: foldable.Foldable<${forType}TypeLambda> = {
  reduce: dual(
    3,
    function reduce<${freeTyParamsPrefix}A, B>(self: ${forType}<${freeTyParamsPrefix}A>, b: B, f: (b: B, a: A) => B): B {
${switchStmt}
    }
  )
}

`)
}

function handleTypeNodes (matcher: RegistryMatcher, forType: string, discriminator: string | undefined, tyParam: string, tyNodes: TypeNode[]): string {
  let cases = ''

  for (const tyNode of tyNodes) {
    cases += handleTypeNode(matcher, forType, discriminator, tyParam, tyNode)
  }

  if (discriminator == null) {
    return cases
  }

  return `\
      switch (self[${JSON.stringify(discriminator)}]) {
${cases}        default:
          throw new Error(\`Unknown tag "\${self[${JSON.stringify(discriminator)}]}"\`)
      }`
}

function handleTypeNode (matcher: RegistryMatcher, forType: string, discriminator: string | undefined, tyParam: string, tyNode: TypeNode): string {
  if (!Node.isTypeLiteral(tyNode)) {
    throw new Error(`Every member of the union type "${forType}" must be a TypeLiteral`)
  }

  let discriminatorValue: string | undefined
  let updates = 'b'

  for (const member of tyNode.getMembers()) {
    if (!Node.isPropertySignature(member)) {
      throw new Error(`Expected a PropertySignature; got ${member.getKindName()}`)
    }

    const memberName = member.getName()
    const memberValue = member.getTypeNodeOrThrow()

    if (discriminator != null && memberName === discriminator) {
      if (!Node.isLiteralTypeNode(memberValue)) {
        throw new Error(`Expected discriminator "${discriminator}" to be a LiteralType; got ${memberValue.getKindName()}`)
      }
      discriminatorValue = memberValue.getText()
      continue
    }

    const reduceFunctions = matcher(tyParam, memberValue)
    if (reduceFunctions == null) continue

    if (reduceFunctions.length === 0) {
      updates = `f(${updates}, self[${JSON.stringify(memberName)}])`
      continue
    }

    if (reduceFunctions.length === 1) {
      updates = `${reduceFunctions[0]}(self[${JSON.stringify(memberName)}], ${updates}, f)`
      continue
    }

    let i = 0
    let suffix = ''
    for (const reduceFunction of reduceFunctions) {
      if (i++ === 0) {
        updates = `${reduceFunction}(self[${JSON.stringify(memberName)}], ${updates}, (b, t) => `
        suffix += ')'
      } else if (i === reduceFunctions.length) {
        updates += `${reduceFunction}(t, b, f)`
      } else {
        updates += `${reduceFunction}(t, b, (b, t) => `
        suffix += ')'
      }
    }

    updates += suffix
  }

  if (discriminator != null && discriminatorValue == null) {
    throw new Error(`Missing a discriminator "${discriminator}"`)
  }

  if (discriminator == null) {
    return `\
      return ${updates}`
  }

  return `\
        case ${discriminatorValue}:
          return ${updates}
`
}
