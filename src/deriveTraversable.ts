import { Node, type TypeNode, type TypeAliasDeclaration } from 'ts-morph'

import { deriveTypeLambda } from './deriveTypeLambda'
import { OutFile } from './OutFile'
import { type Registries } from './Registry'
import { createRegistryMatcher, RegistryMatcher } from './RegistryMatcher'

const tyParamPlaceholders = ['C', 'D']

export function deriveTraversable (inFilePath: string | undefined, forType: string, discriminator: string | undefined, registries: Registries, node: TypeAliasDeclaration): OutFile {
  const outFile = new OutFile()

  const tyParams = node.getTypeParameters()
  if (tyParams.length < 1) {
    throw new Error('At least one type parameter is required to derive Traversable')
  } else if (tyParams.length > 3) {
    throw new Error('At most 3 type parameters are supported when deriving Traversable, due to limitations in effect\'s HKT encoding')
  }

  // In Haskell-style, we take the rightmost type parameter to be the "hole".
  const holeIndex = tyParams.length - 1
  const tyParam = tyParams[holeIndex]
  registries.traversable.set(forType, [holeIndex, 'traverse'])

  const matcher = createRegistryMatcher(registries.traversable)

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
  const switchStmt = handleTypeNodes(matcher, forType, discriminator, freeTyParamsPrefix, tyParam.getName(), tyNodes)

  outFile
    .addPackageAsteriskImport('@effect/typeclass/Applicative', 'applicative')
    .addPackageImport('@effect/typeclass/SemiApplicative', 'ap', 'makeAp')
    .addPackageAsteriskImport('@effect/typeclass/Traversable', 'traversable')
    .addPackageImport('effect/Function', 'dual')
    .addPackageImport('effect/HKT', 'Kind', true)

  if (!registries.typeLambda.has(forType)) {
    outFile.merge(deriveTypeLambda(inFilePath, forType, registries.typeLambda, node))
  }

  if (inFilePath != null) outFile.addLocalImport(inFilePath, forType, true)

  // TODO(mroberts): Maybe OutFile needs to track which type lambdas have been declared, too?
  return outFile.addDeclarations(`\
export const traverse = <F extends TypeLambda>(
  F: applicative.Applicative<F>
): {
  <${freeTyParamsPrefix}A, R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ): (self: ${forType}<${freeTyParamsPrefix}A>) => Kind<F, R, O, E, ${forType}<${freeTyParamsPrefix}B>>
  <${freeTyParamsPrefix}A, R, O, E, B>(
    self: ${forType}<${freeTyParamsPrefix}A>,
    f: (a: A) => Kind<F, R, O, E, B>
  ): Kind<F, R, O, E, ${forType}<${freeTyParamsPrefix}B>>
} => {
  const ap = makeAp(F)
  return dual(
    2,
    <${freeTyParamsPrefix}A, R, O, E, B>(
      self: ${forType}<${freeTyParamsPrefix}A>,
      f: (a: A) => Kind<F, R, O, E, B>
    ): Kind<F, R, O, E, ${forType}<${freeTyParamsPrefix}B>> => {
${switchStmt}
    }
  )
}

export const ${forType[0].toLowerCase() + forType.slice(1)}Traversable: traversable.Traversable<${forType}TypeLambda> = {
  traverse
}

`)
}

function handleTypeNodes (matcher: RegistryMatcher, forType: string, discriminator: string | undefined, freeTyParamsPrefix: string, tyParam: string, tyNodes: TypeNode[]): string {
  let cases = ''

  for (const tyNode of tyNodes) {
    cases += handleTypeNode(matcher, forType, discriminator, freeTyParamsPrefix, tyParam, tyNode)
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

function handleTypeNode (matcher: RegistryMatcher, forType: string, discriminator: string | undefined, freeTyParamsPrefix: string, tyParam: string, tyNode: TypeNode): string {
  if (!Node.isTypeLiteral(tyNode)) {
    throw new Error(`Every member of the union type "${forType}" must be a TypeLiteral`)
  }

  let discriminatorValue: string | undefined
  const updates: Array<[name: string, value: string]> = []

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

    const traverseFunctions = matcher(tyParam, memberValue)
    if (traverseFunctions == null) continue

    if (traverseFunctions.length === 0) {
      updates.push([memberName, `f(self[${JSON.stringify(memberName)}])`])
      continue
    }

    if (traverseFunctions.length === 1) {
      updates.push([memberName, `${traverseFunctions[0]}(F)(self[${JSON.stringify(memberName)}], f)`])
      continue
    }

    let i = 0
    let update = ''
    let suffix = ''
    for (const traverseFunction of traverseFunctions) {
      if (i++ === 0) {
        update += `${traverseFunction}(F)(self[${JSON.stringify(memberName)}], `
        suffix += ')'
      } else if (i === traverseFunctions.length) {
        update += `${traverseFunction}(F)(f)`
      } else {
        update += `${traverseFunction}(F)(`
        suffix += ')'
      }
    }
    updates.push([memberName, update + suffix])
  }

  if (discriminator != null && discriminatorValue == null) {
    throw new Error(`Missing a discriminator "${discriminator}"`)
  }

  const indent = discriminator == null ? '      ' : '          '

  let result = ''
  if (updates.length === 0) {
    result += `return F.of<${forType}<${freeTyParamsPrefix}B>>(self)`
  } else {
    let ctor = ''
    let terms = ''
    for (let i = 0; i < updates.length; i++) {
      ctor += i < updates.length - 1
        ? `b${i} => `
        : `(b${i}): ${forType}<${freeTyParamsPrefix}B> => `
      terms += `const t${i} = ${updates[i][1]}\n${indent}`
    }
    ctor += '({ ...self'
    for (let i = 0; i < updates.length; i++) {
      ctor += `, [${JSON.stringify(updates[i][0])}]: b${i}`
    }
    ctor += ' })'

    let composed = ''
    for (let i = 0; i < updates.length; i++) {
      composed = i === 0
        ? `F.map(t${i}, ${ctor})`
        : `ap(${composed}, t${i})`
    }

    result = `${terms}return ${composed}`
  }

  if (discriminator == null) {
    return `\
      ${result}`
  }

  return `\
        case ${discriminatorValue}:${updates.length > 0 ? ' {' : ''}
          ${result}${updates.length > 0 ? '\n        }' : ''}
`
}
