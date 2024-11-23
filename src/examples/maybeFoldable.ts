import * as foldable from "@effect/typeclass/Foldable"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type Maybe } from "./Maybe"

export interface MaybeTypeLambda extends TypeLambda {
  readonly type: Maybe<this["Target"]>
}

export const maybeFoldable: foldable.Foldable<MaybeTypeLambda> = {
  reduce: dual(
    3,
    function reduce<A, B>(self: Maybe<A>, b: B, f: (b: B, a: A) => B): B {
      switch (self["type"]) {
        case 'Nothing':
          return b
        case 'Just':
          return f(b, self["a"])
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}
