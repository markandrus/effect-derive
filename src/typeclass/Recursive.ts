import type { Covariant } from '@effect/typeclass/Covariant'
import type { Kind, TypeClass, TypeLambda } from 'effect/HKT'

import { type Cofree, extract } from '../data/Cofree.ts'

export interface Recursive<T extends TypeLambda, F extends TypeLambda, TR, TO, TE, TA, FR, FO, FE>
  extends TypeClass<T> {
  readonly F: Covariant<F>
  readonly project: (t: Kind<T, TR, TO, TE, TA>) => Kind<F, FR, FO, FE, Kind<T, TR, TO, TE, TA>>
}

export const cata =
  <T extends TypeLambda, F extends TypeLambda, TR, TO, TE, TA, FR, FO, FE>(
    T: Recursive<T, F, TR, TO, TE, TA, FR, FO, FE>
  ) =>
  <A>(g: (f: Kind<F, FR, FO, FE, A>) => A): ((t: Kind<T, TR, TO, TE, TA>) => A) => {
    return function go(t: Kind<T, TR, TO, TE, TA>): A {
      return g(T.F.map(T.project(t), go))
    }
  }

export const para =
  <T extends TypeLambda, F extends TypeLambda, TR, TO, TE, TA, FR, FO, FE>(
    T: Recursive<T, F, TR, TO, TE, TA, FR, FO, FE>
  ) =>
  <A>(g: (f: Kind<F, FR, FO, FE, [Kind<T, TR, TO, TE, TA>, A]>) => A): ((t: Kind<T, TR, TO, TE, TA>) => A) => {
    return function go(t: Kind<T, TR, TO, TE, TA>): A {
      return g(T.F.map(T.project(t), _ => [_, go(_)]))
    }
  }

type CofreeAlgebra<F extends TypeLambda, FR, FO, FE, WR, WO, WE, A> = (
  f: Kind<F, FR, FO, FE, Cofree<F, WR, WO, WE, A>>
) => A

export const histo =
  <T extends TypeLambda, F extends TypeLambda, TR, TO, TE, TA, FR, FO, FE>(
    T: Recursive<T, F, TR, TO, TE, TA, FR, FO, FE>
  ) =>
  <A>(g: CofreeAlgebra<F, FR, FO, FE, FR, FO, FE, A>) =>
  (ta: Kind<T, TR, TO, TE, TA>): A => {
    function go(ta: Kind<T, TR, TO, TE, TA>): Cofree<F, FR, FO, FE, A> {
      const bc = T.F.map(T.project(ta), go)
      return [g(bc), bc]
    }
    return extract(go(ta))
  }
