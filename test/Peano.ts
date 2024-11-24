import * as assert from 'node:assert'
import { suite, test } from 'node:test'

import { type TypeLambda } from 'effect/HKT'

import { ana, type Corecursive } from '../src/Corecursive'
import { type Peano } from '../src/examples/Peano'
import { Corecursive as PeanoCorecursive, Recursive as PeanoRecursive } from '../src/examples/PeanoF.derived'
import { cata, type Recursive } from '../src/Recursive'

interface PeanoTypeLambda extends TypeLambda {
  readonly type: Peano
}

function toNumber (peano: Peano): number {
  return cata(PeanoRecursive)<number>(peanoF => {
    switch (peanoF.type) {
      case 'Z':
        return 0
      case 'S':
        return peanoF.succ + 1
    }
  })(peano)
}

function fromNumber (number: number): Peano {
  return ana(PeanoCorecursive)<number>(number => {
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

suite('Peano', () => {
  test('toNumber implemented using cata', () => {
    assert.deepStrictEqual(toNumber(peano), 3)
  })
  
  test('fromNumber implemented using ana', () => {
    assert.deepStrictEqual(fromNumber(3), peano)
  })
})