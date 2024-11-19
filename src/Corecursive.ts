import { type Covariant } from '@effect/typeclass/Covariant'
import { type Kind, type TypeClass, type TypeLambda } from 'effect/HKT'

export interface Corecursive<T extends TypeLambda, F extends TypeLambda> extends TypeClass<T> {
  readonly F: Covariant<F>
  readonly embed: <R, O, E, A>(f: Kind<F, R, O, A, Kind<T, R, O, E, A>>) => Kind<T, R, O, E, A>
}

export function ana<T extends TypeLambda, F extends TypeLambda, R, O, E> (
  T: Corecursive<T, F>
): <A, B>(g: (b: B) => Kind<F, R, O, A, B>) => (b: B) => Kind<T, R, O, E, A> {
  return <A, B>(g: (b: B) => Kind<F, R, O, A, B>) => {
    return function go(b: B): Kind<T, R, O, E, A> {
      return T.embed(T.F.map(g(b), go))
    }
  }
}