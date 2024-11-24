import * as applicative from "@effect/typeclass/Applicative"
import * as covariant from "@effect/typeclass/Covariant"
import * as foldable from "@effect/typeclass/Foldable"
import { ap as makeAp } from "@effect/typeclass/SemiApplicative"
import * as traversable from "@effect/typeclass/Traversable"
import { dual } from "effect/Function"
import { type TypeLambda, type Kind } from "effect/HKT"

export type PeanoF<X> = {
    type: 'Z';
} | {
    type: 'S';
    succ: X;
};

export interface PeanoFTypeLambda extends TypeLambda {
  readonly type: PeanoF<this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): (self: PeanoF<A>) => PeanoF<B>
  <A, B>(self: PeanoF<A>, f: (a: A) => B): PeanoF<B>
} = dual(
  2,
  <A, B>(self: PeanoF<A>, f: (a: A) => B): PeanoF<B> => {
    switch (self["type"]) {
      case 'Z':
        return self
      case 'S':
        return { ...self, "succ": f(self["succ"]) }
      default:
        throw new Error(`Unknown tag "${self["type"]}"`)
    }
  }
)

const imap = covariant.imap<PeanoFTypeLambda>(map)

export const peanoFCovariant: covariant.Covariant<PeanoFTypeLambda> = {
  imap,
  map
}

export const peanoFFoldable: foldable.Foldable<PeanoFTypeLambda> = {
  reduce: dual(
    3,
    function reduce<A, B>(self: PeanoF<A>, b: B, f: (b: B, a: A) => B): B {
      switch (self["type"]) {
        case 'Z':
          return b
        case 'S':
          return f(b, self["succ"])
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}

export const traverse = <F extends TypeLambda>(
  F: applicative.Applicative<F>
): {
  <A, R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ): (self: PeanoF<A>) => Kind<F, R, O, E, PeanoF<B>>
  <A, R, O, E, B>(
    self: PeanoF<A>,
    f: (a: A) => Kind<F, R, O, E, B>
  ): Kind<F, R, O, E, PeanoF<B>>
} => {
  const ap = makeAp(F)
  return dual(
    2,
    <A, R, O, E, B>(
      self: PeanoF<A>,
      f: (a: A) => Kind<F, R, O, E, B>
    ): Kind<F, R, O, E, PeanoF<B>> => {
      switch (self["type"]) {
        case 'Z':
          return F.of<PeanoF<B>>(self)
        case 'S': {
          const t0 = f(self["succ"])
          return F.map(t0, (b0): PeanoF<B> => ({ ...self, ["succ"]: b0 }))
        }
        default:
          throw new Error(`Unknown tag "${self["type"]}"`)
      }
    }
  )
}

export const peanoFTraversable: traversable.Traversable<PeanoFTypeLambda> = {
  traverse
}

