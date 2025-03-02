import type { Product } from './Product.ts'
import type { Sum } from './Sum.ts'

export type Complex<A> =
  | { type: 'Complex1'; complex1: Sum<number, Product<string, ReadonlyArray<Complex<A>>>> }
  | {
      type: 'Complex2'
      complex1: Sum<number, Product<string, ReadonlyArray<Complex<A>>>>
      complex2: Sum<number, Product<string, A>>
    }
  | {
      type: 'Complex3'
      complex1: Sum<number, Product<string, ReadonlyArray<Complex<A>>>>
      complex2: Sum<number, Product<string, A>>
      complex3: Sum<number, A>
    }
  | {
      type: 'Complex4'
      complex1: Sum<number, Product<string, ReadonlyArray<Complex<A>>>>
      complex2: Sum<number, Product<string, A>>
      complex3: Sum<number, A>
      complex4: A
    }
