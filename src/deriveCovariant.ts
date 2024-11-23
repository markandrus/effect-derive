import { Node, SyntaxKind, type TypeAliasDeclaration, type TypeNode } from 'ts-morph'

import { OutFile } from './OutFile'
import { type Registry } from './Registry'

const tyParamPlaceholders = ['C', 'D']

type CovariantMatcher = (holeName: string, tyNode: TypeNode) => string[] | undefined  

function createCovariantMatcher (registry: Registry): CovariantMatcher {
  return function covariantMatcher (holeName, tyNode): string[] | undefined {
    switch (tyNode.getKind()) {
      case SyntaxKind.TypeReference: {
        const tyRefNode = tyNode.asKindOrThrow(SyntaxKind.TypeReference)
        const tyRefName = tyRefNode.getTypeName().print()
        if (tyRefName === holeName) return []

        const holeIndexAndMapFunction = registry.get(tyRefName)
        if (holeIndexAndMapFunction == null) return undefined
        const [holeIndex, mapFunction] = holeIndexAndMapFunction

        const tyArg = tyRefNode.getTypeArguments()[holeIndex]
        if (tyArg == null) return undefined

        const tail = covariantMatcher(holeName, tyArg)
        if (tail == null) return undefined

        return [mapFunction].concat(tail)
      }

      case SyntaxKind.ArrayType: {
        const tyArrayNode = tyNode.asKindOrThrow(SyntaxKind.ArrayType)

        const holeIndexAndMapFunction = registry.get('Array')
        if (holeIndexAndMapFunction == null) return undefined
        const mapFunction = holeIndexAndMapFunction[1]

        const elemTyNode = tyArrayNode.getElementTypeNode()
        const tail = covariantMatcher(holeName, elemTyNode)
        if (tail == null) return undefined
        return [mapFunction].concat(tail)
      }

      case SyntaxKind.TypeOperator: {
        const tyOpNode = tyNode.asKindOrThrow(SyntaxKind.TypeOperator)
        if (tyOpNode.getOperator() !== SyntaxKind.ReadonlyKeyword) return undefined

        const tyNode2 = tyOpNode.getTypeNode()
        if (Node.isArrayTypeNode(tyNode2)) {
          const holeIndexAndMapFunction = registry.get('ReadonlyArray')
          if (holeIndexAndMapFunction == null) return undefined
          const mapFunction = holeIndexAndMapFunction[1]

          const elemTyNode = tyNode2.getElementTypeNode()
          const tail = covariantMatcher(holeName, elemTyNode)
          if (tail == null) return undefined
          return [mapFunction].concat(tail)
        }

        return undefined
      }

      default:
        return undefined
    }
  }
}

export function deriveCovariant (inFilePath: string | undefined, forType: string, discriminator: string | undefined, registry: Registry, node: TypeAliasDeclaration): OutFile {
  registry = new Map(registry)
  registry.set(forType, [0, 'map'])
  const covariantMatcher = createCovariantMatcher(registry)
  const outFile = new OutFile()

  const tyParams = node.getTypeParameters()
  if (tyParams.length < 1) {
    throw new Error('At least one type parameter is required to derive functor')
  } else if (tyParams.length > 3) {
    throw new Error('At most 3 type parameters are supported when deriving functor, due to limitations in effect\'s HKT encoding')
  }

  // In Haskell-style, we take the rightmost type parameter to be the "hole"
  // that the Functor instance will use.
  const tyParam = tyParams[tyParams.length - 1]

  let typeLambdaParams = ''
  let freeTyParams = ''
  for (let i = tyParams.length - 2; i >= 0; i--) {
    typeLambdaParams += `this["Out${i + 1}"], `
    freeTyParams += `${tyParamPlaceholders[i]}${i > 0 ? ', ' : ''}`
  }
  typeLambdaParams += 'this["Target"]'

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
  const switchStmt = handleTypeNodes(covariantMatcher, forType, discriminator, tyParam.getName(), tyNodes)

  outFile
    .addPackageAsteriskImport('@effect/typeclass/Covariant', 'covariant')
    .addPackageImport('effect/Function', 'dual')
    .addPackageImport('effect/HKT', 'TypeLambda', true)

  if (inFilePath != null) outFile.addLocalImport(inFilePath, forType, true)

  return outFile.addDeclarations(`\
export interface ${forType}TypeLambda extends TypeLambda {
  readonly type: ${forType}<${typeLambdaParams}>
}

export const map: {
  <A, B>(f: (a: A) => B): ${freeTyParams}(self: ${forType}<${freeTyParamsPrefix}A>) => ${forType}<${freeTyParamsPrefix}B>
  <${freeTyParamsPrefix}A, B>(self: ${forType}<${freeTyParamsPrefix}A>, f: (a: A) => B): ${forType}<${freeTyParamsPrefix}B>
} = dual(
  2,
  <${freeTyParamsPrefix}A, B>(self: ${forType}<${freeTyParamsPrefix}A>, f: (a: A) => B): ${forType}<${freeTyParamsPrefix}B> => {
${switchStmt}
  }
)

const imap = covariant.imap<${forType}TypeLambda>(map)

export const ${forType[0].toLowerCase() + forType.slice(1)}Covariant: covariant.Covariant<${forType}TypeLambda> = {
  imap,
  map
}
`)
}

function handleTypeNodes (covariantMatcher: CovariantMatcher, forType: string, discriminator: string | undefined, tyParam: string, tyNodes: TypeNode[]): string {
  let cases = ''

  for (const tyNode of tyNodes) {
    cases += handleTypeNode(covariantMatcher, forType, discriminator, tyParam, tyNode)
  }

  if (discriminator == null) {
    return cases
  }

  return `\
    switch (self[${JSON.stringify(discriminator)}]) {
${cases}      default:
        throw new Error(\`Unknown tag "\${self[${JSON.stringify(discriminator)}]}"\`)
    }`
}

function handleTypeNode (covariantMatcher: CovariantMatcher, forType: string, discriminator: string | undefined, tyParam: string, tyNode: TypeNode): string {
  if (!Node.isTypeLiteral(tyNode)) {
    throw new Error(`Every member of the union type "${forType}" must be a TypeLiteral`)
  }

  let discriminatorValue: string | undefined
  let updates = ''

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

    const mapFunctions = covariantMatcher(tyParam, memberValue)
    if (mapFunctions == null) continue

    updates += `, ${JSON.stringify(memberName)}: `

    if (mapFunctions.length === 0) {
      updates += `f(self[${JSON.stringify(memberName)}])`
      continue
    }

    let i = 0
    let suffix = ''
    for (const mapFunction of mapFunctions) {
      if (i++ === 0) {
        updates += `${mapFunction}(self[${JSON.stringify(memberName)}], `
        suffix += 'f)'
      } else {
        updates += `_ => ${mapFunction}(_, `
        suffix += ')'
      }
    }

    updates += suffix
  }

  if (discriminator != null && discriminatorValue == null) {
    throw new Error(`Missing a discriminator "${discriminator}"`)
  }

  updates = updates === '' ? 'self' : `{ ...self${updates} }`

  if (discriminator == null) {
    return `\
    return ${updates}`
  }

  return `\
      case ${discriminatorValue}:
        return ${updates}
`
}