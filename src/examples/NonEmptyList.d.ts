import { Maybe } from './Maybe'

export type NonEmptyList<A>
  = { type: 'NonEmptyList', head: A, tail: Maybe<NonEmptyList<A>> }
