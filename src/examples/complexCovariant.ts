import * as covariant from "@effect/typeclass/Covariant"
import { Covariant as ReadonlyArrayCovariant } from "@effect/typeclass/data/Array"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type Complex } from "./Complex"
import { productCovariant as ProductCovariant } from "./productCovariant"
import { sumCovariant as SumCovariant } from "./sumCovariant"

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
