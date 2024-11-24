import * as applicative from "@effect/typeclass/Applicative"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { Traversable as ReadonlyArrayTraversable } from "@effect/typeclass/data/Array"
import { dual } from "effect/Function"
import { type Kind, type TypeLambda } from "effect/HKT"

import { type RoseTree } from "./RoseTree"

export interface RoseTreeTypeLambda extends TypeLambda {
  readonly type: RoseTree<this["Target"]>
}

export const traverse = <F extends TypeLambda>(
  F: applicative.Applicative<F>
): {
  <A, R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ): (self: RoseTree<A>) => Kind<F, R, O, E, RoseTree<B>>
  <A, R, O, E, B>(
    self: RoseTree<A>,
    f: (a: A) => Kind<F, R, O, E, B>
  ): Kind<F, R, O, E, RoseTree<B>>
} => {
  const ap = makeAp(F)
  return dual(
    2,
    <A, R, O, E, B>(
      self: RoseTree<A>,
      f: (a: A) => Kind<F, R, O, E, B>
    ): Kind<F, R, O, E, RoseTree<B>> => {
      const t0 = f(self["rootLabel"])
      const t1 = ReadonlyArrayTraversable.traverse(F)(self["subForest"], traverse(F)(f))
      return ap(F.map(t0, b0 => (b1): RoseTree<B> => ({ ...self, ["rootLabel"]: b0, ["subForest"]: b1 })), t1)
    }
  )
}

export const roseTreeTraversable: traversable.Traversable<RoseTreeTypeLambda> = {
  traverse
}

