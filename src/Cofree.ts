import { type Covariant } from '@effect/typeclass/Covariant'
import { type Kind, type TypeLambda } from 'effect/HKT'

export type Cofree<F extends TypeLambda, R, O, E, A>
  = [A, Kind<F, R, O, E, Cofree<F, R, O, E, A>>]

export const unwrap = <F extends TypeLambda, R, O, E, A>(
  wa: Cofree<F, R, O, E, A>
): Kind<F, R, O, E, Cofree<F, R, O, E, A>> => {
  return wa[1]
}

export const extract = <F extends TypeLambda, R, O, E, A>(
  wa: Cofree<F, R, O, E, A>
): A => {
  return wa[0]
}

export const duplicate = <F extends TypeLambda>(
  F: Covariant<F>
): <R, O, E, A>(self: Cofree<F, R, O, E, A>) => Cofree<F, R, O, E, Cofree<F, R, O, E, A>> => {
  return function duplicate<R, O, E, A>(self: Cofree<F, R, O, E, A>): Cofree<F, R, O, E, Cofree<F, R, O, E, A>> {
    return [self, F.map(unwrap(self), duplicate)]
  }
}

export const extend = <F extends TypeLambda>(
  F: Covariant<F>
): <R, O, E, A, B>(self: Cofree<F, R, O, E, A>, f: (wa: Cofree<F, R, O, E, A>) => B) => Cofree<F, R, O, E, B> => {
  return function extend<R, O, E, A, B>(self: Cofree<F, R, O, E, A>, f: (wa: Cofree<F, R, O, E, A>) => B): Cofree<F, R, O, E, B> {
    return [f(self), F.map(unwrap(self), _ => extend(_, f))]
  }
}

export const mapComposition = <F extends TypeLambda>(
  F: Covariant<F>
): <R, O, E, A, B>(self: Cofree<F, R, O, E, A>, f: (a: A) => B) => Cofree<F, R, O, E, B> => {
  return function map <R, O, E, A, B>(self: Cofree<F, R, O, E, A>, f: (a: A) => B): Cofree<F, R, O, E, B> {
    return [f(self[0]), F.map(self[1], _ => map(_, f))]
  }
}

export const distHisto = <F extends TypeLambda>(
  F: Covariant<F>
): <R, O, E, A>(self: Kind<F, R, O, E, Cofree<F, R, O, E, A>>) => Cofree<F, R, O, E, Kind<F, R, O, E, A>> => {F
  return function distHisto<R, O, E, A>(self: Kind<F, R, O, E, Cofree<F, R, O, E, A>>): Cofree<F, R, O, E, Kind<F, R, O, E, A>> {
    return [F.map(self, extract), F.map(self, _ => distHisto(unwrap(_)))]
  }
}
