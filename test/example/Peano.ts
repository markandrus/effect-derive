import * as assert from 'node:assert'
import { suite, test } from 'node:test'

import type { Peano } from '../../example/Peano.ts'
import { Corecursive as PeanoCorecursive, Recursive as PeanoRecursive } from '../../example/PeanoF.derived.ts'
import { ana } from '../../src/typeclass/Corecursive.ts'
import { cata } from '../../src/typeclass/Recursive.ts'

function toNumber(peano: Peano): number {
  return cata(PeanoRecursive)<number>(peanoF => {
    switch (peanoF.type) {
      case 'Z':
        return 0
      case 'S':
        return peanoF.succ + 1
    }
  })(peano)
}

function fromNumber(number: number): Peano {
  return ana(PeanoCorecursive)<number>(number => {
    return number <= 0 ? { type: 'Z' } : { type: 'S', succ: number - 1 }
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
