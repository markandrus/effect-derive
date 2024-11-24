import * as foldable from "@effect/typeclass/Foldable"
import { Foldable as ReadonlyArrayFoldable } from "@effect/typeclass/data/Array"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type RoseTree } from "./RoseTree"

export interface RoseTreeTypeLambda extends TypeLambda {
  readonly type: RoseTree<this["Target"]>
}

export const roseTreeFoldable: foldable.Foldable<RoseTreeTypeLambda> = {
  reduce: dual(
    3,
    function reduce<A, B>(self: RoseTree<A>, b: B, f: (b: B, a: A) => B): B {
      return ReadonlyArrayFoldable.reduce(self["subForest"], f(b, self["rootLabel"]), (b, t) => reduce(t, b, f))
    }
  )
}

