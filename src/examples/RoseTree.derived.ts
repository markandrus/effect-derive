import * as applicative from "@effect/typeclass/Applicative"
import * as covariant from "@effect/typeclass/Covariant"
import * as foldable from "@effect/typeclass/Foldable"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { Covariant as ReadonlyArrayCovariant, Foldable as ReadonlyArrayFoldable, Traversable as ReadonlyArrayTraversable } from "@effect/typeclass/data/Array"
import { dual } from "effect/Function"
import { type TypeLambda, type Kind } from "effect/HKT"

import { type RoseTree } from "./RoseTree"

export interface RoseTreeTypeLambda extends TypeLambda {
  readonly type: RoseTree<this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): (self: RoseTree<A>) => RoseTree<B>
  <A, B>(self: RoseTree<A>, f: (a: A) => B): RoseTree<B>
} = dual(
  2,
  <A, B>(self: RoseTree<A>, f: (a: A) => B): RoseTree<B> => {
    return { ...self, "rootLabel": f(self["rootLabel"]), "subForest": ReadonlyArrayCovariant.map(self["subForest"], _ => map(_, f)) }
  }
)

const imap = covariant.imap<RoseTreeTypeLambda>(map)

export const Covariant: covariant.Covariant<RoseTreeTypeLambda> = {
  imap,
  map
}

export const Foldable: foldable.Foldable<RoseTreeTypeLambda> = {
  reduce: dual(
    3,
    function reduce<A, B>(self: RoseTree<A>, b: B, f: (b: B, a: A) => B): B {
      return ReadonlyArrayFoldable.reduce(self["subForest"], f(b, self["rootLabel"]), (b, t) => reduce(t, b, f))
    }
  )
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

export const Traversable: traversable.Traversable<RoseTreeTypeLambda> = {
  traverse
}

