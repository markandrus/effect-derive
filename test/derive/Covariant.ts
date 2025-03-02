import * as assert from 'node:assert'
import { describe, test } from 'node:test'

import { buildMapFunction } from '../../src/derive/Covariant.ts'

describe('Covariant', () => {
  test('buildMapFunction', () => {
    const memberName = 'a'
    const mapFunctions = ['f', 'g', 'h']

    const expected = 'f(self["a"], _ => g(_, _ => h(_, f)))'
    const actual = buildMapFunction(memberName, mapFunctions)

    assert.equal(actual, expected)
  })
})
