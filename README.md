effect-derive
=============

This project provides a proof-of-concept command-line tool for deriving types
and typeclass instances to be used with [Effect][effect]. Currently, it can
derive Covariant (AKA Functor) instances for simple types; however, I also plan
to derive base functors from existing algebraic data types (ADTs) for use with
recursion schemes.

Usage
-----

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

You can see a copy of this file checked into the repository. There are also
examples for NonEmptyList and RoseTree:

```ts
// src/NonEmptyList.d.ts
export type NonEmptyList<A>
  = { head: A, tail: A[] }

// src/RoseTree.d.ts
export type RoseTree<A>
  = { rootLabel: A, subForest: Array<RoseTree<A>> }
```

Limitations
-----------

This project is not as powerful as [GHC's `DeriveFunctor`][ghc]. It only
supports derivations for ADTs modeled as discriminated unions, and it only
knows about its own Functor instance, plus a few built-in ones (namely, Array).

In order to solve this, we need a way to register known Functor instances that
the code generator can use.

Developing
----------

Install, generate, and build everything as follows:

```
pnpm install
pnpm run "/^generate:.*/"
pnpm build
```

[effect]: https://github.com/Effect-TS/effect/
[ghc]: https://gitlab.haskell.org/ghc/ghc/-/wikis/commentary/compiler/derive-functor
