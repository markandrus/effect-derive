import * as assert from 'node:assert'
import { test } from 'node:test'

import { type TypeLambda } from 'effect/HKT'

import { ana, type Corecursive } from '../src/Corecursive'
import { type List } from '../src/List'
import { type ListTypeLambda } from '../src/listCovariant'
import { listFCovariant, type ListFTypeLambda } from '../src/ListF'
import { maybeCovariant, type MaybeTypeLambda } from '../src/maybeCovariant'
import { type Peano } from '../src/Peano'
import { peanoFCovariant, type PeanoFTypeLambda } from '../src/PeanoF'
import { cata, histo, type Recursive } from '../src/Recursive'

interface PeanoTypeLambda extends TypeLambda {
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

interface NaturalTypeLambda extends TypeLambda {
  readonly type: number
}

const naturalRecursive: Recursive<NaturalTypeLambda, MaybeTypeLambda> = {
  F: maybeCovariant,
  project: n => n === 0
    ? { type: 'Nothing' }
    : { type: 'Just', a: n - 1 }
}

function fib(number: number): number {
  return histo(naturalRecursive)<number>(maybeF => {
    switch (maybeF.type) {
      case 'Nothing':
        return 1
      case 'Just':
        switch (maybeF.a[1].type) {
          case 'Nothing':
            return 1
          case 'Just':
            return maybeF.a[0] + maybeF.a[1].a[0]
        }
    }
  })(number)
}

test('fib implemented using histo', () => {
  const ns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const actual = ns.map(fib)
  const expected = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
  assert.deepStrictEqual(actual, expected)
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
