import * as foldable from "@effect/typeclass/Foldable"
import { Foldable as ReadonlyArrayFoldable } from "@effect/typeclass/data/Array"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type Complex } from "./Complex"
import { productFoldable as ProductFoldable } from "./productFoldable"
import { sumFoldable as SumFoldable } from "./sumFoldable"

export interface ComplexTypeLambda extends TypeLambda {
  readonly type: Complex<this["Target"]>
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
