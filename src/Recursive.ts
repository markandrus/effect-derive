import { type Covariant } from '@effect/typeclass/Covariant'
import { type Kind, type TypeClass, type TypeLambda } from 'effect/HKT'

export interface Recursive<T extends TypeLambda, F extends TypeLambda> extends TypeClass<T> {
  readonly F: Covariant<F>
  readonly project: <R, O, E, A>(t: Kind<T, R, O, E, A>) => Kind<F, R, O, A, Kind<T, R, O, E, A>>
}

export function cata<T extends TypeLambda, F extends TypeLambda, R, O, E> (
  T: Recursive<T, F>
): <A, B>(f: (fab: Kind<F, R, O, A, B>) => B) => (ta: Kind<T, R, O, E, A>) => B {
  return <A, B>(f: (fab: Kind<F, R, O, A, B>) => B) => {
    return function go(ta: Kind<T, R, O, E, A>): B {
      return f(T.F.map(T.project(ta), go))
    }
  }
}