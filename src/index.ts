import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'
import * as util from 'node:util'

import { Node, Project, SyntaxKind, type TypeAliasDeclaration, type TypeNode } from 'ts-morph'

const tyParamPlaceholders = ['C', 'D']

function handleTypeAliasDeclaration (inFilePath: string, forType: string, discriminator: string | undefined, node: TypeAliasDeclaration): string {
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
  const switchStmt = handleTypeNodes(forType, discriminator, tyParam.getName(), tyNodes)

  return `\
import * as covariant from "@effect/typeclass/Covariant"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type ${forType} } from "${inFilePath}"

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
`
}

function handleTypeNodes (forType: string, discriminator: string | undefined, tyParam: string, tyNodes: TypeNode[]): string {
  let cases = ''

  for (const tyNode of tyNodes) {
    cases += handleTypeNode(forType, discriminator, tyParam, tyNode)
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

function handleTypeNode (forType: string, discriminator: string | undefined, tyParam: string, tyNode: TypeNode): string {
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

    if (Node.isTypeReference(memberValue)) {
      const tyName = memberValue.getTypeName().getText()
      const tyArgs = memberValue.getTypeArguments()
      if (tyName === tyParam && tyArgs.length === 0) {
        updates += `, ${JSON.stringify(memberName)}: f(self[${JSON.stringify(memberName)}])`
      } else if (tyName === forType) {
        const tyArg = tyArgs.at(-1)
        if (Node.isTypeReference(tyArg)) {
          const tyArgName = tyArg.getTypeName().getText()
          if (tyArgName === tyParam && tyArg.getTypeArguments().length === 0) {
            updates += `, ${JSON.stringify(memberName)}: map(self[${JSON.stringify(memberName)}], f)`
          }
        }
      } else if (tyName === 'Array' && tyArgs.length === 1) {
        const tyArg = tyArgs[0]
        if (Node.isTypeReference(tyArg)) {
          const tyArgName = tyArg.getTypeName().getText()
          if (tyArgName === tyParam && tyArg.getTypeArguments().length === 0) {
            updates += `, ${JSON.stringify(memberName)}: self[${JSON.stringify(memberName)}].map(f)`
          } else if (tyArgName === forType) {
            const tyArg2 = tyArg.getTypeArguments().at(-1)
            if (Node.isTypeReference(tyArg2)) {
              const tyArg2Name = tyArg2.getTypeName().getText()
              if (tyArg2Name === tyParam && tyArg2.getTypeArguments().length === 0) {
                updates += `, ${JSON.stringify(memberName)}: self[${JSON.stringify(memberName)}].map(map(f))`
              }
            }
          }
        }
      }
    } else if (Node.isArrayTypeNode(memberValue)) {
      const elemTyNode = memberValue.getElementTypeNode()
      if (Node.isTypeReference(elemTyNode)) {
        const tyName = elemTyNode.getTypeName().getText()
        if (tyName === tyParam && elemTyNode.getTypeArguments().length === 0) {
          updates += `, ${JSON.stringify(memberName)}: self[${JSON.stringify(memberName)}].map(f)`
        } else if (tyName === forType) {
          const tyArg = elemTyNode.getTypeArguments().at(-1)
          if (Node.isTypeReference(tyArg)) {
            const tyArgName = tyArg.getTypeName().getText()
            if (tyArgName === tyParam && tyArg.getTypeArguments().length === 0) {
              updates += `, ${JSON.stringify(memberName)}: self[${JSON.stringify(memberName)}].map(map(f))`
            }
          }
        }
      }
    }
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

  if (positionals.length !== 1 || positionals[0] !== 'Covariant') {
    throw new Error('Expected exactly one positional argument "Covariant"')
  }

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

  let outFileContents = ''
  for (const node of inFile.getChildSyntaxListOrThrow().getChildren()) {
    if (Node.isTypeAliasDeclaration(node)) {
      if (node.getName() === forType) {
        outFileContents = handleTypeAliasDeclaration(inFilePath, forType, discriminator, node)
        break
      }
    }
  }

  if (outFileContents === '') {
    throw new Error(`Failed to find a type alias named "${forType}"`)
  }

  fs.writeFileSync(outFilePath, outFileContents)
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    main()
  }
}
