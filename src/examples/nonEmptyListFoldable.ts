import * as foldable from "@effect/typeclass/Foldable"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type NonEmptyList } from "./NonEmptyList"
import { maybeFoldable as MaybeFoldable } from "./maybeFoldable"

export interface NonEmptyListTypeLambda extends TypeLambda {
  readonly type: NonEmptyList<this["Target"]>
}

export const nonEmptyListFoldable: foldable.Foldable<NonEmptyListTypeLambda> = {
  reduce: dual(
    3,
    function reduce<A, B>(self: NonEmptyList<A>, b: B, f: (b: B, a: A) => B): B {
      return MaybeFoldable.reduce(self["tail"], f(b, self["head"]), (b, t) => reduce(t, b, f))
    }
  )
}
