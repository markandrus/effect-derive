import * as applicative from "@effect/typeclass/Applicative"
import * as covariant from "@effect/typeclass/Covariant"
import * as foldable from "@effect/typeclass/Foldable"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { dual } from "effect/Function"
import { type TypeLambda, type Kind } from "effect/HKT"

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

export const listFCovariant: covariant.Covariant<ListFTypeLambda> = {
  imap,
  map
}

export const listFFoldable: foldable.Foldable<ListFTypeLambda> = {
  reduce: dual(
    3,
    function reduce<C, A, B>(self: ListF<C, A>, b: B, f: (b: B, a: A) => B): B {
      switch (self["type"]) {
        case 'Nil':
          return b
        case 'Cons':
          return f(b, self["tail"])
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}

export const traverse = <F extends TypeLambda>(
  F: applicative.Applicative<F>
): {
  <C, A, R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ): (self: ListF<C, A>) => Kind<F, R, O, E, ListF<C, B>>
  <C, A, R, O, E, B>(
    self: ListF<C, A>,
    f: (a: A) => Kind<F, R, O, E, B>
  ): Kind<F, R, O, E, ListF<C, B>>
} => {
  const ap = makeAp(F)
  return dual(
    2,
    <C, A, R, O, E, B>(
      self: ListF<C, A>,
      f: (a: A) => Kind<F, R, O, E, B>
    ): Kind<F, R, O, E, ListF<C, B>> => {
      switch (self["type"]) {
        case 'Nil':
          return F.of<ListF<C, B>>(self)
        case 'Cons': {
          const t0 = f(self["tail"])
          return F.map(t0, (b0): ListF<C, B> => ({ ...self, ["tail"]: b0 }))
        }
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}

export const listFTraversable: traversable.Traversable<ListFTypeLambda> = {
  traverse
}

