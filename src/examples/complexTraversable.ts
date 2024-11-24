import * as applicative from "@effect/typeclass/Applicative"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { Traversable as ReadonlyArrayTraversable } from "@effect/typeclass/data/Array"
import { dual } from "effect/Function"
import { type Kind, type TypeLambda } from "effect/HKT"

import { type Complex } from "./Complex"
import { productTraversable as ProductTraversable } from "./productTraversable"
import { sumTraversable as SumTraversable } from "./sumTraversable"

export interface ComplexTypeLambda extends TypeLambda {
  readonly type: Complex<this["Target"]>
}

export const traverse = <F extends TypeLambda>(
  F: applicative.Applicative<F>
): {
  <A, R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ): (self: Complex<A>) => Kind<F, R, O, E, Complex<B>>
  <A, R, O, E, B>(
    self: Complex<A>,
    f: (a: A) => Kind<F, R, O, E, B>
  ): Kind<F, R, O, E, Complex<B>>
} => {
  const ap = makeAp(F)
  return dual(
    2,
    <A, R, O, E, B>(
      self: Complex<A>,
      f: (a: A) => Kind<F, R, O, E, B>
    ): Kind<F, R, O, E, Complex<B>> => {
      switch (self["type"]) {
        case 'Complex1': {
          const t0 = SumTraversable.traverse(F)(self["complex1"], ProductTraversable.traverse(F)(ReadonlyArrayTraversable.traverse(F)(traverse(F)(f))))
          return F.map(t0, (b0): Complex<B> => ({ ...self, ["complex1"]: b0 }))
        }
        case 'Complex2': {
          const t0 = SumTraversable.traverse(F)(self["complex1"], ProductTraversable.traverse(F)(ReadonlyArrayTraversable.traverse(F)(traverse(F)(f))))
          const t1 = SumTraversable.traverse(F)(self["complex2"], ProductTraversable.traverse(F)(f))
          return ap(F.map(t0, b0 => (b1): Complex<B> => ({ ...self, ["complex1"]: b0, ["complex2"]: b1 })), t1)
        }
        case 'Complex3': {
          const t0 = SumTraversable.traverse(F)(self["complex1"], ProductTraversable.traverse(F)(ReadonlyArrayTraversable.traverse(F)(traverse(F)(f))))
          const t1 = SumTraversable.traverse(F)(self["complex2"], ProductTraversable.traverse(F)(f))
          const t2 = SumTraversable.traverse(F)(self["complex3"], f)
          return ap(ap(F.map(t0, b0 => b1 => (b2): Complex<B> => ({ ...self, ["complex1"]: b0, ["complex2"]: b1, ["complex3"]: b2 })), t1), t2)
        }
        case 'Complex4': {
          const t0 = SumTraversable.traverse(F)(self["complex1"], ProductTraversable.traverse(F)(ReadonlyArrayTraversable.traverse(F)(traverse(F)(f))))
          const t1 = SumTraversable.traverse(F)(self["complex2"], ProductTraversable.traverse(F)(f))
          const t2 = SumTraversable.traverse(F)(self["complex3"], f)
          const t3 = f(self["complex4"])
          return ap(ap(ap(F.map(t0, b0 => b1 => b2 => (b3): Complex<B> => ({ ...self, ["complex1"]: b0, ["complex2"]: b1, ["complex3"]: b2, ["complex4"]: b3 })), t1), t2), t3)
        }
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}

export const complexTraversable: traversable.Traversable<ComplexTypeLambda> = {
  traverse
}

