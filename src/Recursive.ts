import { type Covariant } from '@effect/typeclass/Covariant'
import { type Kind, type TypeClass, type TypeLambda } from 'effect/HKT'
import { Cofree, distHisto, duplicate, extract, mapComposition } from './Cofree'

export interface Recursive<T extends TypeLambda, F extends TypeLambda> extends TypeClass<T> {
  readonly F: Covariant<F>
  readonly project: <R, O, E, A>(t: Kind<T, R, O, E, A>) => Kind<F, R, O, A, Kind<T, R, O, E, A>>
}

export function cata<T extends TypeLambda, F extends TypeLambda, R, O, E>(
  T: Recursive<T, F>
): <A, B>(f: (fab: Kind<F, R, O, A, B>) => B) => (ta: Kind<T, R, O, E, A>) => B {
  return <A, B>(f: (fab: Kind<F, R, O, A, B>) => B) => {
    return function go(ta: Kind<T, R, O, E, A>): B {
      return f(T.F.map(T.project(ta), go))
    }
  }
}

export function para<T extends TypeLambda, F extends TypeLambda, R, O, E>(
  T: Recursive<T, F>
): <A>(f: (fta: Kind<F, R, O, A, [Kind<T, R, O, E, A>, A]>) => A) => (ta: Kind<T, R, O, E, A>) => A {
  return <A>(f: (fta: Kind<F, R, O, A, [Kind<T, R, O, E, A>, A]>) => A) => {
    return function go(ta: Kind<T, R, O, E, A>): A {
      return f(T.F.map(T.project(ta), _ => [_, go(_)]))
    }
  }
}

function gcata<T extends TypeLambda, F extends TypeLambda>(
  T: Recursive<T, F>
): (
  k: <R, O, E, A, B>(f: Kind<F, R, O, A, Cofree<F, R, O, E, B>>) => Cofree<F, R, O, E, Kind<F, R, O, A, B>>
) => <R, O, E, A>(
  g: (f: Kind<F, R, O, A, Cofree<F, R, O, E, A>>) => A
) => (
  t: Kind<T, R, O, E, A>
) => A {
  const map = mapComposition(T.F)
  const dup = duplicate(T.F)
  return (k: <R, O, E, A, B>(f: Kind<F, R, O, A, Cofree<F, R, O, E, B>>) => Cofree<F, R, O, E, Kind<F, R, O, A, B>>) => {
    return <R, O, E, A>(g: (f: Kind<F, R, O, A, Cofree<F, R, O, E, A>>) => A) => {
      function c(t: Kind<T, R, O, E, A>): Cofree<F, R, O, E, Kind<F, R, O, A, Cofree<F, R, O, E, A>>> {
        return k(T.F.map(T.project(t), _ => dup((map(c(_), g)))))
      }

      return (t: Kind<T, R, O, E, A>): A => g(extract(c(t)))
    }
  }
}

export const histo = <T extends TypeLambda, F extends TypeLambda, R, O, E>(
  T: Recursive<T, F>
) => <A>(g: (f: Kind<F, R, O, A, Cofree<F, R, O, E, A>>) => A) => (ta: Kind<T, R, O, E, A>): A => {
  const trust = distHisto(T.F) as unknown as <R, O, E, A, B>(f: Kind<F, R, O, E, Cofree<F, R, O, A, B>>) => Cofree<F, R, O, A, Kind<F, R, O, E, B>>
  return gcata(T)(trust)(g)(ta)
}