import * as assert from 'node:assert'
import { test } from 'node:test'

import { type List } from '../src/List'
import { type ListF, listFCovariant } from '../src/ListF'

function project<A> (list: List<A>): ListF<A, List<A>> {
  return list
}

function cata<A, B> (f: (listF: ListF<A, B>) => B): (list: List<A>) => B {
  return function c(list: List<A>): B {
    return f(listFCovariant.map(project(list), c))
  }
}

function toArray<A> (list: List<A>): A[] {
  return cata<A, A[]>(listF => {
    switch (listF.type) {
      case 'Nil':
        return []
      case 'Cons':
        return [listF.head].concat(listF.tail)
    }
  })(list)
}

test('toArray implemented using cata', () => {
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
  const actual = toArray(list)
  const expected = [1, 2, 3]
  assert.deepStrictEqual(actual, expected)
})