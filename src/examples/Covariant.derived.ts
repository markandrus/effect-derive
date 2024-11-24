import * as applicative from "@effect/typeclass/Applicative"
import * as covariant from "@effect/typeclass/Covariant"
import * as foldable from "@effect/typeclass/Foldable"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { Covariant as ReadonlyArrayCovariant, Foldable as ReadonlyArrayFoldable, Traversable as ReadonlyArrayTraversable } from "@effect/typeclass/data/Array"
import { dual } from "effect/Function"
import { type TypeLambda, type Kind } from "effect/HKT"

import { type Complex } from "./Complex"
import { productCovariant as ProductCovariant, productFoldable as ProductFoldable, productTraversable as ProductTraversable } from "./Product.derived"
import { sumCovariant as SumCovariant, sumFoldable as SumFoldable, sumTraversable as SumTraversable } from "./Sum.derived"

export interface ComplexTypeLambda extends TypeLambda {
  readonly type: Complex<this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): (self: Complex<A>) => Complex<B>
  <A, B>(self: Complex<A>, f: (a: A) => B): Complex<B>
} = dual(
  2,
  <A, B>(self: Complex<A>, f: (a: A) => B): Complex<B> => {
    switch (self["type"]) {
      case 'Complex1':
        return { ...self, "complex1": SumCovariant.map(self["complex1"], _ => ProductCovariant.map(_, _ => ReadonlyArrayCovariant.map(_, _ => map(_, f)))) }
      case 'Complex2':
        return { ...self, "complex1": SumCovariant.map(self["complex1"], _ => ProductCovariant.map(_, _ => ReadonlyArrayCovariant.map(_, _ => map(_, f)))), "complex2": SumCovariant.map(self["complex2"], _ => ProductCovariant.map(_, f)) }
      case 'Complex3':
        return { ...self, "complex1": SumCovariant.map(self["complex1"], _ => ProductCovariant.map(_, _ => ReadonlyArrayCovariant.map(_, _ => map(_, f)))), "complex2": SumCovariant.map(self["complex2"], _ => ProductCovariant.map(_, f)), "complex3": SumCovariant.map(self["complex3"], f) }
      case 'Complex4':
        return { ...self, "complex1": SumCovariant.map(self["complex1"], _ => ProductCovariant.map(_, _ => ReadonlyArrayCovariant.map(_, _ => map(_, f)))), "complex2": SumCovariant.map(self["complex2"], _ => ProductCovariant.map(_, f)), "complex3": SumCovariant.map(self["complex3"], f), "complex4": f(self["complex4"]) }
      default:
        throw new Error(`Unknown tag "${self["type"]}"`)
    }
  }
)

const imap = covariant.imap<ComplexTypeLambda>(map)

export const complexCovariant: covariant.Covariant<ComplexTypeLambda> = {
  imap,
  map
}

export const complexFoldable: foldable.Foldable<ComplexTypeLambda> = {
  reduce: dual(
    3,
    function reduce<A, B>(self: Complex<A>, b: B, f: (b: B, a: A) => B): B {
      switch (self["type"]) {
        case 'Complex1':
          return SumFoldable.reduce(self["complex1"], b, (b, t) => ProductFoldable.reduce(t, b, (b, t) => ReadonlyArrayFoldable.reduce(t, b, (b, t) => reduce(t, b, f))))
        case 'Complex2':
          return SumFoldable.reduce(self["complex2"], SumFoldable.reduce(self["complex1"], b, (b, t) => ProductFoldable.reduce(t, b, (b, t) => ReadonlyArrayFoldable.reduce(t, b, (b, t) => reduce(t, b, f)))), (b, t) => ProductFoldable.reduce(t, b, f))
        case 'Complex3':
          return SumFoldable.reduce(self["complex3"], SumFoldable.reduce(self["complex2"], SumFoldable.reduce(self["complex1"], b, (b, t) => ProductFoldable.reduce(t, b, (b, t) => ReadonlyArrayFoldable.reduce(t, b, (b, t) => reduce(t, b, f)))), (b, t) => ProductFoldable.reduce(t, b, f)), f)
        case 'Complex4':
          return f(SumFoldable.reduce(self["complex3"], SumFoldable.reduce(self["complex2"], SumFoldable.reduce(self["complex1"], b, (b, t) => ProductFoldable.reduce(t, b, (b, t) => ReadonlyArrayFoldable.reduce(t, b, (b, t) => reduce(t, b, f)))), (b, t) => ProductFoldable.reduce(t, b, f)), f), self["complex4"])
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

