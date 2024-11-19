effect-derive
=============

This project provides a proof-of-concept command-line tool for deriving types
and typeclass instances to be used with [Effect][effect]. Currently, it can
derive [Covariant][covariant] (AKA [Functor][functor]) instances and
base functors (a la [recursion-schemes][recursion_schemes]) for simple algebraic
data types (ADTs).

Usage
-----

### Derive `Covariant`

Assume we have the input file src/List.d.ts:

```ts
export type List<A>
  = { type: 'Nil' }
  | { type: 'Cons', head: A, tail: List<A> }
```

Then we can generate the output file src/listCovariant.ts as follows:

```sh
npx @markandrus/effect-derive Covariant \
  --for-type List \
  --discriminator type \
  --in-file src/List.d.ts \
  --out-file src/listCovariant.ts
```

You can see a copy of this file checked into the repository.

There are also examples for NonEmptyList and RoseTree:

```ts
// src/NonEmptyList.d.ts
export type NonEmptyList<A>
  = { head: A, tail: A[] }

// src/RoseTree.d.ts
export type RoseTree<A>
  = { rootLabel: A, subForest: Array<RoseTree<A>> }
```

### Derive `BaseFunctor`

Assume we have the same input file src/List.d.ts as above, then the base functor
for List would be ListF:

```ts
export type ListF<A, X>
  = { type: 'Nil' }
  | { type: 'Cons', head: A, tail: X }
```

We can generate ListF and its Covariant instance as follows:

```sh
npx @markandrus/effect-derive BaseFunctor \
  --for-type List \
  --discriminator type \
  --in-file src/List.d.ts \
  --out-file src/ListF.ts
```

You can see a copy of this file checked into the repository.

There is also an example for Peano:

```ts
// src/Peano.d.ts
export type Peano
  = { type: 'Z' }
  | { type: 'S', succ: Peano }
```

Limitations
-----------

This project is not as powerful as [GHC's `DeriveFunctor`][ghc]. It only
supports derivations for ADTs modeled as discriminated unions, and it only
knows about its own Functor instance, plus a few built-in ones (namely, Array).
In order to solve this, we need a way to register known Functor instances that
the code generator can use. Base functor derivation is even more limited.

Developing
----------

Install, generate, and build everything as follows:

```
pnpm install
pnpm run "/^generate:.*/"
pnpm build
pnpm test
```

[effect]: https://github.com/Effect-TS/effect/
[covariant]: https://effect-ts.github.io/effect/typeclass/Covariant.ts.html
[functor]: https://hackage.haskell.org/package/base-4.20.0.1/docs/Data-Functor.html
[recursion_schemes]: https://hackage.haskell.org/package/recursion-schemes
[ghc]: https://gitlab.haskell.org/ghc/ghc/-/wikis/commentary/compiler/derive-functor
