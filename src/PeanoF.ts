import * as covariant from "@effect/typeclass/Covariant"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

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
