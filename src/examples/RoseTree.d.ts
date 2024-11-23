export type RoseTree<A>
  = { rootLabel: A, subForest: ReadonlyArray<RoseTree<A>> }
