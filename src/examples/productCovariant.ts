import * as covariant from "@effect/typeclass/Covariant"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type Product } from "./Product"

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

export const productCovariant: covariant.Covariant<ProductTypeLambda> = {
  imap,
  map
}
