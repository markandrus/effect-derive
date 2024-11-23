import * as foldable from "@effect/typeclass/Foldable"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type Sum } from "./Sum"

export interface SumTypeLambda extends TypeLambda {
  readonly type: Sum<this["Out1"], this["Target"]>
}

export const sumFoldable: foldable.Foldable<SumTypeLambda> = {
  reduce: dual(
    3,
    function reduce<C, A, B>(self: Sum<C, A>, b: B, f: (b: B, a: A) => B): B {
      switch (self["type"]) {
        case 'A':
          return b
        case 'B':
          return f(b, self["b"])
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}
