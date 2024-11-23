import * as assert from 'node:assert'
import { suite, test } from 'node:test'

import { ana, type Corecursive } from '../src/Corecursive'
import { type List } from '../src/examples/List'
import { type ListTypeLambda } from '../src/examples/listCovariant'
import { listFCovariant, type ListFTypeLambda } from '../src/examples/ListF'
import { cata, type Recursive } from '../src/Recursive'

const listRecursive: <A>() => Recursive<ListTypeLambda, ListFTypeLambda, never, never, never, A, never, never, A> = () => ({
  F: listFCovariant,
  project: t => t
})

const listCorecursive: Corecursive<ListTypeLambda, ListFTypeLambda> = {
  F: listFCovariant,
  embed: t => t
}

function toArray<A> (list: List<A>): A[] {
  return cata(listRecursive<A>())<A[]>(listF => {
    switch (listF.type) {
      case 'Nil':
        return []
      case 'Cons':
        return [listF.head].concat(listF.tail)
    }
  })(list)
}

function fromArray<A> (as: A[]): List<A> {
  return ana(listCorecursive)<A, A[]>(as => {
    if (as.length === 0) {
      return { type: 'Nil' }
    } else {
      return { type: 'Cons', head: as[0], tail: as.slice(1) }
    }
  })(as)
}

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

suite('List', () => {
  test('toArray implemented using cata', () => {
    assert.deepStrictEqual(toArray(list), array)
  })

  test('fromArray implemented using ana', () => {
    assert.deepStrictEqual(fromArray(array), list)
  })
})
