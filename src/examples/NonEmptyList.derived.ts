import * as applicative from "@effect/typeclass/Applicative"
import * as covariant from "@effect/typeclass/Covariant"
import * as foldable from "@effect/typeclass/Foldable"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { dual } from "effect/Function"
import { type TypeLambda, type Kind } from "effect/HKT"

import { maybeCovariant as MaybeCovariant, maybeFoldable as MaybeFoldable, maybeTraversable as MaybeTraversable } from "./Maybe.derived"
import { type NonEmptyList } from "./NonEmptyList"

export interface NonEmptyListTypeLambda extends TypeLambda {
  readonly type: NonEmptyList<this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): (self: NonEmptyList<A>) => NonEmptyList<B>
  <A, B>(self: NonEmptyList<A>, f: (a: A) => B): NonEmptyList<B>
} = dual(
  2,
  <A, B>(self: NonEmptyList<A>, f: (a: A) => B): NonEmptyList<B> => {
    return { ...self, "head": f(self["head"]), "tail": MaybeCovariant.map(self["tail"], _ => map(_, f)) }
  }
)

const imap = covariant.imap<NonEmptyListTypeLambda>(map)

export const nonEmptyListCovariant: covariant.Covariant<NonEmptyListTypeLambda> = {
  imap,
  map
}

export const nonEmptyListFoldable: foldable.Foldable<NonEmptyListTypeLambda> = {
  reduce: dual(
    3,
    function reduce<A, B>(self: NonEmptyList<A>, b: B, f: (b: B, a: A) => B): B {
      return MaybeFoldable.reduce(self["tail"], f(b, self["head"]), (b, t) => reduce(t, b, f))
    }
  )
}

export const traverse = <F extends TypeLambda>(
  F: applicative.Applicative<F>
): {
  <A, R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ): (self: NonEmptyList<A>) => Kind<F, R, O, E, NonEmptyList<B>>
  <A, R, O, E, B>(
    self: NonEmptyList<A>,
    f: (a: A) => Kind<F, R, O, E, B>
  ): Kind<F, R, O, E, NonEmptyList<B>>
} => {
  const ap = makeAp(F)
  return dual(
    2,
    <A, R, O, E, B>(
      self: NonEmptyList<A>,
      f: (a: A) => Kind<F, R, O, E, B>
    ): Kind<F, R, O, E, NonEmptyList<B>> => {
      const t0 = f(self["head"])
      const t1 = MaybeTraversable.traverse(F)(self["tail"], traverse(F)(f))
      return ap(F.map(t0, b0 => (b1): NonEmptyList<B> => ({ ...self, ["head"]: b0, ["tail"]: b1 })), t1)
    }
  )
}

export const nonEmptyListTraversable: traversable.Traversable<NonEmptyListTypeLambda> = {
  traverse
}

