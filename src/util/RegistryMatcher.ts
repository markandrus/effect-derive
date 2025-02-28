import { Node, SyntaxKind, type TypeNode } from 'ts-morph'

import { type Registry } from './Registry.ts'

export type RegistryMatcher = (holeName: string, tyNode: TypeNode) => string[] | undefined

export function createRegistryMatcher (registry: Registry): RegistryMatcher {
  return function registryMatcher (holeName, tyNode): string[] | undefined {
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

        const tail = registryMatcher(holeName, tyArg)
        if (tail == null) return undefined

        return [mapFunction].concat(tail)
      }

      case SyntaxKind.ArrayType: {
        const tyArrayNode = tyNode.asKindOrThrow(SyntaxKind.ArrayType)

        const holeIndexAndMapFunction = registry.get('Array')
        if (holeIndexAndMapFunction == null) return undefined
        const mapFunction = holeIndexAndMapFunction[1]

        const elemTyNode = tyArrayNode.getElementTypeNode()
        const tail = registryMatcher(holeName, elemTyNode)
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
          const tail = registryMatcher(holeName, elemTyNode)
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
