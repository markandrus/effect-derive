# Tools

The project uses Node.js 23 features, especially the default
--experimental-strip-types feature.

# Testing

Tests are stored outside of the src directory, under test. You can run them with
`pnpm test`.

We have two types:

- Unit tests: for example, test/derive/Covariant.ts tests functions used by
  src/derive/Covariant.ts.
- End-to-end tests: for example, test/example/List.ts tests that derived type
  class instances for src/example/List.ts function correctly.

The end-to-end tests require you to run `pnpm run '/generate/'` first. This will
generate the derived type class instances (for example,
src/example/List.derived.ts)

It may make sense to split src/examples out into its own directory, outside of
src.

## WebStorm

In order for the tests and debugger to work, you should be on WebStorm 2024.3.4
or later. Then you need to edit the default Node.js Test Runner configuration,
setting "Loader" to "Manual setup in Node options" and passing
"--experimental-transform-types" in "Node options".
