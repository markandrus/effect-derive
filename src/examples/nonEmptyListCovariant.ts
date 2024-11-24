import * as covariant from "@effect/typeclass/Covariant"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type NonEmptyList } from "./NonEmptyList"
import { maybeCovariant as MaybeCovariant } from "./maybeCovariant"

export interface NonEmptyListTypeLambda extends TypeLambda {
  readonly type: NonEmptyList<this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): (self: NonEmptyList<A>) => NonEmptyList<B>
  <A, B>(self: NonEmptyList<A>, f: (a: A) => B): NonEmptyList<B>
} = dual(
  2,
  <A, B>(self: NonEmptyList<A>, f: (a: A) => B): NonEmptyList<B> => {
    return { ...self, "head": f(self["head"]), "tail": MaybeCovariant.map(self["tail"], _ => map(_, f)) }
  }
)

const imap = covariant.imap<NonEmptyListTypeLambda>(map)

export const nonEmptyListCovariant: covariant.Covariant<NonEmptyListTypeLambda> = {
  imap,
  map
}

