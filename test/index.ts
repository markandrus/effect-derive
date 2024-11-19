import * as assert from 'node:assert'
import { test } from 'node:test'

import { type TypeLambda } from 'effect/HKT'

import { ana, type Corecursive } from '../src/Corecursive'
import { type List } from '../src/List'
import { type ListTypeLambda } from '../src/listCovariant'
import { listFCovariant, type ListFTypeLambda } from '../src/ListF'
import { type Peano } from '../src/Peano'
import { peanoFCovariant, type PeanoFTypeLambda } from '../src/PeanoF'
import { cata, type Recursive } from '../src/Recursive'

export interface PeanoTypeLambda extends TypeLambda {
  readonly type: Peano
}

const peanoRecursive: Recursive<PeanoTypeLambda, PeanoFTypeLambda> = {
  F: peanoFCovariant,
  project: t => t
}

const peanoCorecursive: Corecursive<PeanoTypeLambda, PeanoFTypeLambda> = {
  F: peanoFCovariant,
  embed: t => t
}

function toNumber (peano: Peano): number {
  return cata(peanoRecursive)<number, number>(peanoF => {
    switch (peanoF.type) {
      case 'Z':
        return 0
      case 'S':
        return peanoF.succ + 1
    }
  })(peano)
}

function fromNumber (number: number): Peano {
  return ana(peanoCorecursive)<number, number>(number => {
    return number <= 0
      ? { type: 'Z' }
      : { type: 'S', succ: number - 1 }
  })(number)
}

const peano: Peano = {
  type: 'S',
  succ: {
    type: 'S',
    succ: {
      type: 'S',
      succ: {
        type: 'Z'
      }
    }
  }
}

test('toNumber implemented using cata', () => {
  assert.deepStrictEqual(toNumber(peano), 3)
})

test('fromNumber implemented using ana', () => {
  assert.deepStrictEqual(fromNumber(3), peano)
})

const listRecursive: Recursive<ListTypeLambda, ListFTypeLambda> = {
  F: listFCovariant,
  project: t => t
}

const listCorecursive: Corecursive<ListTypeLambda, ListFTypeLambda> = {
  F: listFCovariant,
  embed: t => t
}

function toArray<A> (list: List<A>): A[] {
  return cata(listRecursive)<A, A[]>(listF => {
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

test('toArray implemented using cata', () => {
  assert.deepStrictEqual(toArray(list), array)
})

test('fromArray implemented using ana', () => {
  assert.deepStrictEqual(fromArray(array), list)
})
