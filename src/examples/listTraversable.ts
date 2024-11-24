import * as applicative from "@effect/typeclass/Applicative"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { dual } from "effect/Function"
import { type Kind, type TypeLambda } from "effect/HKT"

import { type List } from "./List"

export interface ListTypeLambda extends TypeLambda {
  readonly type: List<this["Target"]>
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

export const listTraversable: traversable.Traversable<ListTypeLambda> = {
  traverse
}

