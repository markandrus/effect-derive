import * as assert from 'node:assert'
import { suite, test } from 'node:test'

import { type NonEmptyList } from '../src/examples/NonEmptyList'
import { nonEmptyListFoldable } from '../src/examples/nonEmptyListFoldable'

const toArrayReduce = <A>(nonEmptyList: NonEmptyList<A>): A[] => nonEmptyListFoldable.reduce<A, A[]>([], (as, a) => as.concat([a]))(nonEmptyList) 

const nonEmptyList: NonEmptyList<number> = {
  type: 'NonEmptyList',
  head: 1,
  tail: {
    type: 'Just',
    a: {
      type: 'NonEmptyList',
      head: 2,
      tail: {
        type: 'Just',
        a: {
          type: 'NonEmptyList',
          head: 3,
          tail: {
            type: 'Nothing'
          }
        }
      }
    }
  }
}

const array = [1, 2, 3]

suite('NonEmptyList', () => {
  test('toArray implemented using reduce', () => {
    assert.deepStrictEqual(toArrayReduce(nonEmptyList), array)
  })
})
