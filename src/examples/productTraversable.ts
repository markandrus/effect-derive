import * as applicative from "@effect/typeclass/Applicative"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { dual } from "effect/Function"
import { type Kind, type TypeLambda } from "effect/HKT"

import { type Product } from "./Product"

export interface ProductTypeLambda extends TypeLambda {
  readonly type: Product<this["Out1"], this["Target"]>
}

export const traverse = <F extends TypeLambda>(
  F: applicative.Applicative<F>
): {
  <C, A, R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ): (self: Product<C, A>) => Kind<F, R, O, E, Product<C, B>>
  <C, A, R, O, E, B>(
    self: Product<C, A>,
    f: (a: A) => Kind<F, R, O, E, B>
  ): Kind<F, R, O, E, Product<C, B>>
} => {
  const ap = makeAp(F)
  return dual(
    2,
    <C, A, R, O, E, B>(
      self: Product<C, A>,
      f: (a: A) => Kind<F, R, O, E, B>
    ): Kind<F, R, O, E, Product<C, B>> => {
      const t0 = f(self["b"])
      return F.map(t0, (b0): Product<C, B> => ({ ...self, ["b"]: b0 }))
    }
  )
}

export const productTraversable: traversable.Traversable<ProductTypeLambda> = {
  traverse
}

