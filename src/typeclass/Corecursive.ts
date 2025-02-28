import { type Covariant } from '@effect/typeclass/Covariant'
import { type Kind, type TypeClass, type TypeLambda } from 'effect/HKT'

export interface Corecursive<T extends TypeLambda, F extends TypeLambda, TR, TO, TE, TA, FR, FO, FE> extends TypeClass<T> {
  readonly F: Covariant<F>
  readonly embed: (f: Kind<F, FR, FO, FE, Kind<T, TR, TO, TE, TA>>) => Kind<T, TR, TO, TE, TA>
}

export const ana = <T extends TypeLambda, F extends TypeLambda, TR, TO, TE, TA, FR, FO, FE> (
  T: Corecursive<T, F, TR, TO, TE, TA, FR, FO, FE>
) => <B>(g: (b: B) => Kind<F, FR, FO, FE, B>) => (b: B): Kind<T, TR, TO, TE, TA> => {
  function go(b: B): Kind<T, TR, TO, TE, TA> {
    return T.embed(T.F.map(g(b), go))
  }

  return go(b)
}