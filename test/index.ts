import * as assert from 'node:assert'
import { test } from 'node:test'

import { type List } from '../src/List'
import { type ListF, listFCovariant } from '../src/ListF'

function project<A> (list: List<A>): ListF<A, List<A>> {
  return list
}

function embed<A> (listF: ListF<A, List<A>>): List<A> {
  return listF
}

function cata<A, B> (f: (listF: ListF<A, B>) => B): (list: List<A>) => B {
  return function go(list: List<A>): B {
    return f(listFCovariant.map(project(list), go))
  }
}

function ana<A, B> (g: (b: B) => ListF<A, B>): (b: B) => List<A> {
  return function go(b: B): List<A> {
    return embed(listFCovariant.map(g(b), go))
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

function fromArray<A> (as: A[]): List<A> {
  return ana<A, A[]>(as => {
    if (as.length === 0) {
      return { type: 'Nil' }
    } else {
      return { type: 'Cons', head: as[0], tail: as.slice(1) }
    }
  })(as)
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

test('fromArray implemented using ana', () => {
  const as = [1, 2, 3]
  const actual = fromArray(as)
  const expected: List<number> = {
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
  assert.deepStrictEqual(actual, expected)
})