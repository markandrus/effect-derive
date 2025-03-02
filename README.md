effect-derive
=============

This project provides a command-line tool for deriving types and type class
instances that can be used with [Effect][effect]. Specifically, it can derive

| Effect type class            | Haskell equivalent           |
|:---------------------------- |:---------------------------- |
| [Covariant][e_covariant]     | [Functor][h_functor]         |
| [Foldable][e_foldable]       | [Foldable][h_foldable]       |
| [Traversable][e_traversable] | [Traversable][h_traversable] |

It can also derive base functors for recursive data types, along with their
Recursive and Corecursive type class instances, in the style of
[recursion-schemes][recursion_schemes]. This unlocks the ability to fold and
unfold instances of the recursive data type using functions like `cata`, `para`,
`histo`, and `ana`.

Usage
-----

### Derive Covariant, Foldable & Traversable

Assume we have the following definition of a List:

```ts
// example/List.ts

export type List<A>
  = { type: 'Nil' }
  | { type: 'Cons', head: A, tail: List<A> }
```

Then we can generate its Covariant, Foldable, and Traversable instances as
follows:

```sh
npx @markandrus/effect-derive \
  Covariant Foldable Traversable \
  --for-type List \
  --discriminator type \
  --in-file example/List.ts \
  --out-file example/List.derived.ts
```

#### Registering additional type class instances

Assume we have the following definition of a RoseTree:

```ts
// example/RoseTree.ts

export type RoseTree<A> = {
  rootLabel: A
  subForest: ReadonlyArray<RoseTree<A>>
}
```

The tool doesn't know anything about ReadonlyArray, so we must tell it where to
find its Covariant, Foldable, and Traversable instances:

```sh
npx @markandrus/effect-derive \
  Covariant Foldable Traversable \
  --for-type RoseTree \
  --discriminator type \
  --in-file example/RoseTree.ts \
  --out-file example/RoseTree.derived.ts \
  --covariant '@effect/typeclass/data/Array#Covariant#ReadonlyArray<_>' \
  --foldable '@effect/typeclass/data/Array#Foldable#ReadonlyArray<_>' \
  --traversable '@effect/typeclass/data/Array#Traversable#ReadonlyArray<_>'
```

You can register as many additional type class instances as needed.

### Derive BaseFunctor, Recursive & Corecursive

Many recursive data types can be expressed as the fixed point of some base
functor. For example, we can derive the base functor for List by replacing each
of its recursive positions with a type variable:

```ts
export type ListF<A, X>
  = { type: 'Nil' }
  | { type: 'Cons', head: A, tail: X }
```

We can derive this base functor, as well as its Recursive and Corecursive
instances, as follows:

```sh
npx @markandrus/effect-derive \
  BaseFunctor Recursive Corecursive \
  --for-type List \
  --discriminator type \
  --in-file example/List.ts \
  --out-file example/ListF.derived.ts
```

Note that Covariant is derived automatically with BaseFunctor, but you can also
derive Foldable and Traversable, if you like. You can also register additional
type class instances, as needed.

### Register an existing TypeLambda

Most of the commands will derive TypeLambda instances as necessary; however, if
you already have a TypeLambda you want to reuse, you can register it:

```sh
--type-lambda './example/List.derived#ListTypeLambda#List'
```

Limitations
-----------

- Currently, only relatively simple types are supported. We should expand
  support to tuples and other sorts of types, including function types.
- Effect's higher-kinded type (HKT) encoding restricts the arity of types this
  tool can derive instances for to just 2 or 3 type parameters.
- The tool does not check all the [requirements for legal instances][reqs] that
  it should; however, these could be added.
- The tool usually works with the last type parameter, in Haskell-style;
  however, many Effect types map over the first type parameter. The tool should
  support specifying type parameter to use.

Developing
----------

Install, generate, and build everything as follows:

```
pnpm install
pnpm run "/^generate:.*/"
pnpm build
pnpm test
```

Related work
------------

This project is a loose port of [GHC's `DeriveFunctor`][ghc] and
Edward Kmett's recursion-schemes to TypeScript. It reuses type classes from
Effect and depends on its [HKT encoding][hkt].

[effect]: https://github.com/Effect-TS/effect/
[e_covariant]: https://effect-ts.github.io/effect/typeclass/Covariant.ts.html
[e_foldable]: https://effect-ts.github.io/effect/typeclass/Foldable.ts.html
[e_traversable]: https://effect-ts.github.io/effect/typeclass/Traversable.ts.html
[h_functor]: https://hackage.haskell.org/package/base/docs/Data-Functor.html
[h_foldable]: https://hackage.haskell.org/package/base/docs/Data-Foldable.html
[h_traversable]: https://hackage.haskell.org/package/base/docs/Data-Traversable.html
[recursion_schemes]: https://hackage.haskell.org/package/recursion-schemes
[reqs]: https://gitlab.haskell.org/ghc/ghc/-/wikis/commentary/compiler/derive-functor#requirements-for-legal-instances
[ghc]: https://gitlab.haskell.org/ghc/ghc/-/wikis/commentary/compiler/derive-functor
[hkt]: https://dev.to/effect/encoding-of-hkts-in-typescript-5c3
