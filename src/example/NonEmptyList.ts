import { type Maybe } from './Maybe.ts'

export type NonEmptyList<A>
  = { type: 'NonEmptyList', head: A, tail: Maybe<NonEmptyList<A>> }
