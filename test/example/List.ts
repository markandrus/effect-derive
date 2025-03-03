import * as assert from 'node:assert'
import { describe, test } from 'node:test'

import { Foldable as ListFoldable } from '../../example/List.derived.ts'
import type { List } from '../../example/List.ts'
import { Corecursive as ListCorecursive, Recursive as ListRecursive } from '../../example/ListF.derived.ts'
import { ana } from '../../src/typeclass/Corecursive.ts'
import { cata } from '../../src/typeclass/Recursive.ts'

const toArrayReduce = <A>(list: List<A>): A[] => ListFoldable.reduce<A, A[]>([], (as, a) => as.concat([a]))(list)

const toArrayCata = <A>(list: List<A>): A[] =>
  cata(ListRecursive<A>())<A[]>(listF => {
    switch (listF.type) {
      case 'Nil':
        return []
      case 'Cons':
        return [listF.head].concat(listF.tail)
    }
  })(list)

const fromArrayAna = <A>(as: A[]): List<A> =>
  ana(ListCorecursive<A>())<A[]>(as => {
    if (as.length === 0) {
      return { type: 'Nil' }
    } else {
      return { type: 'Cons', head: as[0], tail: as.slice(1) }
    }
  })(as)

const list: List<number> = {
  type: 'Cons',
  head: 1,
  tail: {
    type: 'Cons',
    head: 2,
    tail: {
      type: 'Cons',
      head: 3,
      tail: {
        type: 'Nil'
      }
    }
  }
}

const array = [1, 2, 3]

describe('List', () => {
  test('toArray implemented using reduce', () => {
    assert.deepStrictEqual(toArrayReduce(list), array)
  })

  test('toArray implemented using cata', () => {
    assert.deepStrictEqual(toArrayCata(list), array)
  })

  test('fromArray implemented using ana', () => {
    assert.deepStrictEqual(fromArrayAna(array), list)
  })
})
