import type { Covariant } from '@effect/typeclass/Covariant'
import type { Kind, TypeLambda } from 'effect/HKT'

export type Free<F extends TypeLambda, R, O, E, A> =
  | { type: 'Pure'; a: A }
  | { type: 'Free'; fa: Kind<F, R, O, E, Free<F, R, O, E, A>> }

export const mapComposition = <F extends TypeLambda>(
  F: Covariant<F>
): (<R, O, E, A, B>(self: Free<F, R, O, E, A>, f: (a: A) => B) => Free<F, R, O, E, B>) => {
  return function map<R, O, E, A, B>(self: Free<F, R, O, E, A>, f: (a: A) => B): Free<F, R, O, E, B> {
    switch (self.type) {
      case 'Pure':
        return { type: 'Pure', a: f(self.a) }
      case 'Free':
        return { type: 'Free', fa: F.map(self.fa, _ => map(_, f)) }
    }
  }
}
