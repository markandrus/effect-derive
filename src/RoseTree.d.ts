export type RoseTree<A>
  = { rootLabel: A, subForest: Array<RoseTree<A>> }
