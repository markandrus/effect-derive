import * as assert from 'node:assert'
import { suite, test } from 'node:test'

import type { TypeLambda } from 'effect/HKT'

import { Covariant as MaybeCovariant, type MaybeTypeLambda } from '../src/example/Maybe.derived.ts'
import { type Recursive, histo } from '../src/typeclass/Recursive.ts'

interface NaturalTypeLambda extends TypeLambda {
  readonly type: number
}

const naturalRecursive: Recursive<NaturalTypeLambda, MaybeTypeLambda, never, never, never, never, never, never, never> =
  {
    F: MaybeCovariant,
    project: n => (n === 0 ? { type: 'Nothing' } : { type: 'Just', a: n - 1 })
  }

function fib(number: number): number {
  return histo(naturalRecursive)<number>(maybe => {
    switch (maybe.type) {
      case 'Nothing':
        return 1
      case 'Just':
        switch (maybe.a[1].type) {
          case 'Nothing':
            return 1
          case 'Just': {
            const fibNMinus1 = maybe.a[0]
            const fibNMinus2 = maybe.a[1].a[0]
            return fibNMinus1 + fibNMinus2
          }
        }
    }
  })(number)
}

suite('Natural', () => {
  test('fib implemented using histo', () => {
    const ns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const actual = ns.map(fib)
    const expected = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
    assert.deepStrictEqual(actual, expected)
  })
})
