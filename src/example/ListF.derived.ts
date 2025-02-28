import * as covariant from "@effect/typeclass/Covariant"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type Corecursive as C } from "../typeclass/Corecursive.ts"
import { type Recursive as R } from "../typeclass/Recursive.ts"
import { type ListTypeLambda as ListTypeLambda } from "./List.derived.ts"

export type ListF<A, X> = {
    type: 'Nil';
} | {
    type: 'Cons';
    head: A;
    tail: X;
};

export interface ListFTypeLambda extends TypeLambda {
  readonly type: ListF<this["Out1"], this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): <C>(self: ListF<C, A>) => ListF<C, B>
  <C, A, B>(self: ListF<C, A>, f: (a: A) => B): ListF<C, B>
} = dual(
  2,
  <C, A, B>(self: ListF<C, A>, f: (a: A) => B): ListF<C, B> => {
    switch (self["type"]) {
      case 'Nil':
        return self
      case 'Cons':
        return { ...self, "tail": f(self["tail"]) }
      default:
        throw new Error(`Unknown tag "${self["type"]}"`)
    }
  }
)

const imap = covariant.imap<ListFTypeLambda>(map)

export const Covariant: covariant.Covariant<ListFTypeLambda> = {
  imap,
  map
}

export const Recursive: <A>() => R<ListTypeLambda, ListFTypeLambda, never, never, never, A, never, never, A> = () => ({
  F: Covariant,
  project: t => t
})

export const Corecursive: <A>() => C<ListTypeLambda, ListFTypeLambda, never, never, never, A, never, never, A> = () => ({
  F: Covariant,
  embed: t => t
})

