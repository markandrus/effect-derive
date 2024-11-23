import * as covariant from "@effect/typeclass/Covariant"
import { Covariant as ReadonlyArrayCovariant } from "@effect/typeclass/data/Array"
import { dual } from "effect/Function"
import { type TypeLambda } from "effect/HKT"

import { type RoseTree } from "./RoseTree"

export interface RoseTreeTypeLambda extends TypeLambda {
  readonly type: RoseTree<this["Target"]>
}

export const map: {
  <A, B>(f: (a: A) => B): (self: RoseTree<A>) => RoseTree<B>
  <A, B>(self: RoseTree<A>, f: (a: A) => B): RoseTree<B>
} = dual(
  2,
  <A, B>(self: RoseTree<A>, f: (a: A) => B): RoseTree<B> => {
    return { ...self, "rootLabel": f(self["rootLabel"]), "subForest": ReadonlyArrayCovariant.map(self["subForest"], _ => map(_, f)) }
  }
)

const imap = covariant.imap<RoseTreeTypeLambda>(map)

export const roseTreeCovariant: covariant.Covariant<RoseTreeTypeLambda> = {
  imap,
  map
}
