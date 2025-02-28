import * as applicative from "@effect/typeclass/Applicative"
import * as covariant from "@effect/typeclass/Covariant"
import * as foldable from "@effect/typeclass/Foldable"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { dual } from "effect/Function"
import { type TypeLambda, type Kind } from "effect/HKT"

import { type Maybe } from "./Maybe.ts"

export interface MaybeTypeLambda extends TypeLambda {
  readonly type: Maybe<this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): (self: Maybe<A>) => Maybe<B>
  <A, B>(self: Maybe<A>, f: (a: A) => B): Maybe<B>
} = dual(
  2,
  <A, B>(self: Maybe<A>, f: (a: A) => B): Maybe<B> => {
    switch (self["type"]) {
      case 'Nothing':
        return self
      case 'Just':
        return { ...self, "a": f(self["a"]) }
      default:
        throw new Error(`Unknown tag "${self["type"]}"`)
    }
  }
)

const imap = covariant.imap<MaybeTypeLambda>(map)

export const Covariant: covariant.Covariant<MaybeTypeLambda> = {
  imap,
  map
}

export const Foldable: foldable.Foldable<MaybeTypeLambda> = {
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

export const traverse = <F extends TypeLambda>(
  F: applicative.Applicative<F>
): {
  <A, R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ): (self: Maybe<A>) => Kind<F, R, O, E, Maybe<B>>
  <A, R, O, E, B>(
    self: Maybe<A>,
    f: (a: A) => Kind<F, R, O, E, B>
  ): Kind<F, R, O, E, Maybe<B>>
} => {
  const ap = makeAp(F)
  return dual(
    2,
    <A, R, O, E, B>(
      self: Maybe<A>,
      f: (a: A) => Kind<F, R, O, E, B>
    ): Kind<F, R, O, E, Maybe<B>> => {
      switch (self["type"]) {
        case 'Nothing':
          return F.of<Maybe<B>>(self)
        case 'Just': {
          const t0 = f(self["a"])
          return F.map(t0, (b0): Maybe<B> => ({ ...self, ["a"]: b0 }))
        }
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}

export const Traversable: traversable.Traversable<MaybeTypeLambda> = {
  traverse
}

