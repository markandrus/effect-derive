import * as covariant from "@effect/typeclass/Covariant"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type Sum } from "./Sum"

export interface SumTypeLambda extends TypeLambda {
  readonly type: Sum<this["Out1"], this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): <C>(self: Sum<C, A>) => Sum<C, B>
  <C, A, B>(self: Sum<C, A>, f: (a: A) => B): Sum<C, B>
} = dual(
  2,
  <C, A, B>(self: Sum<C, A>, f: (a: A) => B): Sum<C, B> => {
    switch (self["type"]) {
      case 'A':
        return self
      case 'B':
        return { ...self, "b": f(self["b"]) }
      default:
        throw new Error(`Unknown tag "${self["type"]}"`)
    }
  }
)

const imap = covariant.imap<SumTypeLambda>(map)

export const sumCovariant: covariant.Covariant<SumTypeLambda> = {
  imap,
  map
}
