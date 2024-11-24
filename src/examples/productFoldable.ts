import * as foldable from "@effect/typeclass/Foldable"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type Product } from "./Product"

export interface ProductTypeLambda extends TypeLambda {
  readonly type: Product<this["Out1"], this["Target"]>
}

export const productFoldable: foldable.Foldable<ProductTypeLambda> = {
  reduce: dual(
    3,
    function reduce<C, A, B>(self: Product<C, A>, b: B, f: (b: B, a: A) => B): B {
      return f(b, self["b"])
    }
  )
}

