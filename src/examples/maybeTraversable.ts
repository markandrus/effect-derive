import * as applicative from "@effect/typeclass/Applicative"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { dual } from "effect/Function"
import { type Kind, type TypeLambda } from "effect/HKT"

import { type Maybe } from "./Maybe"

export interface MaybeTypeLambda extends TypeLambda {
  readonly type: Maybe<this["Target"]>
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

export const maybeTraversable: traversable.Traversable<MaybeTypeLambda> = {
  traverse
}

