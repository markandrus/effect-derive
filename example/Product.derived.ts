import * as applicative from "@effect/typeclass/Applicative"
import * as covariant from "@effect/typeclass/Covariant"
import * as foldable from "@effect/typeclass/Foldable"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { dual } from "effect/Function"
import { type TypeLambda, type Kind } from "effect/HKT"

import { type Product } from "./Product.ts"

export interface ProductTypeLambda extends TypeLambda {
  readonly type: Product<this["Out1"], this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): <C>(self: Product<C, A>) => Product<C, B>
  <C, A, B>(self: Product<C, A>, f: (a: A) => B): Product<C, B>
} = dual(
  2,
  <C, A, B>(self: Product<C, A>, f: (a: A) => B): Product<C, B> => {
    return { ...self, "b": f(self["b"]) }
  }
)

const imap = covariant.imap<ProductTypeLambda>(map)

export const Covariant: covariant.Covariant<ProductTypeLambda> = {
  imap,
  map
}

export const Foldable: foldable.Foldable<ProductTypeLambda> = {
  reduce: dual(
    3,
    function reduce<C, A, B>(self: Product<C, A>, b: B, f: (b: B, a: A) => B): B {
      return f(b, self["b"])
    }
  )
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

export const Traversable: traversable.Traversable<ProductTypeLambda> = {
  traverse
}

