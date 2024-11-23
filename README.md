effect-derive
=============

This project provides a proof-of-concept command-line tool for deriving types
and typeclass instances to be used with [Effect][effect]. Currently, it can
derive [Covariant][covariant] (AKA [Functor][functor]) instances and
base functors (a la [recursion-schemes][recursion_schemes]) for simple algebraic
data types (ADTs). The tool is inspired by [GHC's `DeriveFunctor`][ghc].

Working on

- [ ] Recursive
- [ ] Corecursive
- [x] Foldable
- [x] Traversable

Usage
-----

### Derive a Covariant instance

Assume we have the input file src/examples/List.ts:

```ts
export type List<A>
  = { type: 'Nil' }
  | { type: 'Cons', head: A, tail: List<A> }
```

Then we can generate the output file src/examples/listCovariant.ts as follows:

```sh
npx @markandrus/effect-derive Covariant \
  --for-type List \
  --discriminator type \
  --in-file src/examples/List.ts \
  --out-file src/examples/listCovariant.ts
```

You can see copies of these files checked-in to the src/examples directory.

### Derive a BaseFunctor data type

We can derive a base functor for List by replacing all the recursive positions
in List with a type variable:

```ts
export type ListF<A, X>
  = { type: 'Nil' }
  | { type: 'Cons', head: A, tail: X }
```

We can generate this base functor as follows:

```sh
npx @markandrus/effect-derive BaseFunctor \
  --for-type List \
  --discriminator type \
  --in-file src/examples/List.ts \
  --out-file src/examples/ListF.ts
```

You can see copies of these files checked-in to the src/examples directory.

### Register additional Covariant instances

The tool only knows about the Covariant instances you tell it about. For
example, consider a RoseTree:

```ts
export type RoseTree<A> = {
  rootLabel: A,
  subForest: ReadonlyArray<RoseTree<A>>
}
```

The `subForest` property is the composition of two functors, ReadonlyArray and
RoseTree; however, by default, the tool will only know about RoseTree. We have
to tell it that ReadonlyArray has a Covariant instance, too. We can do this
using the `--covariant` flag:

```sh
npx @markandrus/effect-derive Covariant \
  --for-type RoseTree \
  --in-file src/examples/RoseTree.ts \
  --out-file src/examples/roseTreeCovariant.ts \
  --covariant '@effect/typeclass/data/Array#Covariant#ReadonlyArray<_>'
```

The format of the `--covariant` flag should be 2–3 values:

1. import path (can be relative or absolute)
2. export name pointing to the Covariant instance (omit for default export)
3. the type name with a hole marked `_`

You can pass the `--covariant` flag multiple times to register additional
Covariant instances.

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
