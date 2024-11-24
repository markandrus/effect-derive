import * as applicative from "@effect/typeclass/Applicative"
import * as covariant from "@effect/typeclass/Covariant"
import * as foldable from "@effect/typeclass/Foldable"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { dual } from "effect/Function"
import { type TypeLambda, type Kind } from "effect/HKT"

import { type List } from "./List"

export interface ListTypeLambda extends TypeLambda {
  readonly type: List<this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): (self: List<A>) => List<B>
  <A, B>(self: List<A>, f: (a: A) => B): List<B>
} = dual(
  2,
  <A, B>(self: List<A>, f: (a: A) => B): List<B> => {
    switch (self["type"]) {
      case 'Nil':
        return self
      case 'Cons':
        return { ...self, "head": f(self["head"]), "tail": map(self["tail"], f) }
      default:
        throw new Error(`Unknown tag "${self["type"]}"`)
    }
  }
)

const imap = covariant.imap<ListTypeLambda>(map)

export const Covariant: covariant.Covariant<ListTypeLambda> = {
  imap,
  map
}

export const Foldable: foldable.Foldable<ListTypeLambda> = {
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

export const traverse = <F extends TypeLambda>(
  F: applicative.Applicative<F>
): {
  <A, R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ): (self: List<A>) => Kind<F, R, O, E, List<B>>
  <A, R, O, E, B>(
    self: List<A>,
    f: (a: A) => Kind<F, R, O, E, B>
  ): Kind<F, R, O, E, List<B>>
} => {
  const ap = makeAp(F)
  return dual(
    2,
    <A, R, O, E, B>(
      self: List<A>,
      f: (a: A) => Kind<F, R, O, E, B>
    ): Kind<F, R, O, E, List<B>> => {
      switch (self["type"]) {
        case 'Nil':
          return F.of<List<B>>(self)
        case 'Cons': {
          const t0 = f(self["head"])
          const t1 = traverse(F)(self["tail"], f)
          return ap(F.map(t0, b0 => (b1): List<B> => ({ ...self, ["head"]: b0, ["tail"]: b1 })), t1)
        }
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}

export const Traversable: traversable.Traversable<ListTypeLambda> = {
  traverse
}

