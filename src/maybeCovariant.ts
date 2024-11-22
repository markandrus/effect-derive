import * as covariant from "@effect/typeclass/Covariant"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type Maybe } from "./Maybe"

export interface MaybeTypeLambda extends TypeLambda {
  readonly type: Maybe<this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): (self: Maybe<A>) => Maybe<B>
  <A, B>(self: Maybe<A>, f: (a: A) => B): Maybe<B>
} = dual(
  2,
  <A, B>(self: Maybe<A>, f: (a: A) => B): Maybe<B> => {
    switch (self["type"]) {
      case 'Nothing':
        return self
      case 'Just':
        return { ...self, "a": f(self["a"]) }
      default:
        throw new Error(`Unknown tag "${self["type"]}"`)
    }
  }
)

const imap = covariant.imap<MaybeTypeLambda>(map)

export const maybeCovariant: covariant.Covariant<MaybeTypeLambda> = {
  imap,
  map
}
