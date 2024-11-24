import * as covariant from "@effect/typeclass/Covariant"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type List } from "./List"

export interface ListTypeLambda extends TypeLambda {
  readonly type: List<this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): (self: List<A>) => List<B>
  <A, B>(self: List<A>, f: (a: A) => B): List<B>
} = dual(
  2,
  <A, B>(self: List<A>, f: (a: A) => B): List<B> => {
    switch (self["type"]) {
      case 'Nil':
        return self
      case 'Cons':
        return { ...self, "head": f(self["head"]), "tail": map(self["tail"], f) }
      default:
        throw new Error(`Unknown tag "${self["type"]}"`)
    }
  }
)

const imap = covariant.imap<ListTypeLambda>(map)

export const listCovariant: covariant.Covariant<ListTypeLambda> = {
  imap,
  map
}

