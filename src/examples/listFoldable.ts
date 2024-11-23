import * as foldable from "@effect/typeclass/Foldable"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type List } from "./List"

export interface ListTypeLambda extends TypeLambda {
  readonly type: List<this["Target"]>
}

export const listFoldable: foldable.Foldable<ListTypeLambda> = {
  reduce: dual(
    3,
    function reduce<A, B>(self: List<A>, b: B, f: (b: B, a: A) => B): B {
      switch (self["type"]) {
        case 'Nil':
          return b
        case 'Cons':
          return reduce(self["tail"], f(b, self["head"]), f)
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}
