import * as applicative from "@effect/typeclass/Applicative"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { dual } from "effect/Function"
import { type Kind, type TypeLambda } from "effect/HKT"

import { type Sum } from "./Sum"

export interface SumTypeLambda extends TypeLambda {
  readonly type: Sum<this["Out1"], this["Target"]>
}

export const traverse = <F extends TypeLambda>(
  F: applicative.Applicative<F>
): {
  <C, A, R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ): (self: Sum<C, A>) => Kind<F, R, O, E, Sum<C, B>>
  <C, A, R, O, E, B>(
    self: Sum<C, A>,
    f: (a: A) => Kind<F, R, O, E, B>
  ): Kind<F, R, O, E, Sum<C, B>>
} => {
  const ap = makeAp(F)
  return dual(
    2,
    <C, A, R, O, E, B>(
      self: Sum<C, A>,
      f: (a: A) => Kind<F, R, O, E, B>
    ): Kind<F, R, O, E, Sum<C, B>> => {
      switch (self["type"]) {
        case 'A':
          return F.of<Sum<C, B>>(self)
        case 'B': {
          const t0 = f(self["b"])
          return F.map(t0, (b0): Sum<C, B> => ({ ...self, ["b"]: b0 }))
        }
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}

export const sumTraversable: traversable.Traversable<SumTypeLambda> = {
  traverse
}

