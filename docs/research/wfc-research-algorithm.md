# Wave Function Collapse Algorithm Notes

## Scope

This document describes the algorithm implemented in [`src/wfc/wfc-engine.ts`](../../src/wfc/wfc-engine.ts), not an idealized or general-purpose WFC implementation. Planned changes are identified explicitly.

## Model

The solver works on a rectangular grid. Each cell has a domain: a `Set<string>` of tile IDs that may occupy that cell.

- A domain containing more than one ID is unresolved.
- A single-ID domain is collapsed.
- An empty domain is a contradiction.

Tile definitions provide directional compatibility sets. For example, a tile's `right` set contains the IDs it permits directly to its right.

## Current Solve Procedure

1. Create a new grid in which each cell permits every configured tile.
2. Apply optional runtime cell constraints.
3. Propagate all constrained cells through a queue until no neighbor domain changes.
4. Find the first uncollapsed cell with the smallest domain size.
5. Save a grid snapshot.
6. Choose one tile from the domain with a weighted `Math.random()` selection.
7. Propagate the changed cell through the queue.
8. Repeat until every cell is collapsed, a contradiction cannot be recovered, or the iteration limit is reached.

The iteration limit is `gridWidth * gridHeight * 10`. The private backtrack limit is 1,000.

## Propagation

For each queued source cell and each in-bounds neighbor:

1. Read the allowed neighbor set for the source-to-neighbor direction.
2. If the source has multiple possible tiles, union the allowed sets of all those tiles.
3. Intersect the neighbor's domain with that union.
4. If the domain changed, queue the neighbor.
5. If the domain becomes empty, report a contradiction.

This is iterative queue-based propagation. It avoids recursive call-depth limits and propagates fixed floor masks before the solver makes random choices.

## Constrained WFC

[`WFCCellConstraint`](../../src/wfc/types.ts) narrows the domain of one cell before solving:

```ts
const solution = new WaveFunctionCollapse(config).solve({
  cellConstraints: [
    { x: 4, y: 3, allowedTileIds: ['floor'] },
    { x: 5, y: 3, allowedTileIds: ['floor', 'floor_mossy'] },
  ],
});
```

The implementation:

- validates coordinates and tile IDs;
- rejects empty allowed lists;
- intersects repeated constraints at the same coordinate;
- propagates constraints before entropy selection; and
- returns `complete: false` for a valid but unsatisfiable arrangement.

Constrained WFC preserves local tile compatibility. It does not guarantee global properties such as connected floors, a minimum room size, or a unique entrance. A future layout generator should create or validate those properties outside this local solver.

## Randomness and Reproducibility

The solver currently uses `Math.random()` and therefore produces non-reproducible grids.

[`SeededFloorConstraintGenerator`](../../src/wfc/types.ts) reserves a place for a deterministic seeded floor-mask generator. The current [`generateSeededFloorConstraints()`](../../src/wfc/seeded-floor-constraints.ts) implementation throws intentionally. Even after that generator exists, reproducible final maps will also require the WFC solver's random source to be seeded or injected.

## Backtracking: Current Limitation

The solver snapshots every grid before a random collapse. On propagation failure, it restores and removes the most recent snapshot, then returns to the solve loop.

It does **not** record the chosen tile or remove it from the restored domain. A subsequent weighted selection can choose the same failing tile. This is partial recovery, not complete alternative-choice backtracking.

A complete backtracking design should store a decision record containing:

- the snapshot before the decision;
- the selected coordinate;
- the tile IDs not yet tried at that coordinate; and
- any random-state information needed for reproducibility.

On contradiction, it should restore the decision snapshot, remove the failed choice, and retry another remaining choice. If no choices remain, it should continue to the previous decision.

## Rotation-Derived Tile Variants: Deferred Feature

The global symmetry configuration and its partial validation were removed. They did not rotate sprites, generate tile IDs, or add missing directional neighbor rules, so they provided no value for the explicitly oriented castle tiles.

The current model requires every tile to declare its own directional neighbor rules. This supports separate top, bottom, left, and right walls as well as all four corner tiles.

If future content authoring benefits from deriving visual rotations, implement a separate opt-in rotation-derived tile-variants feature. It must generate a distinct tile ID for each rotation, choose or transform the corresponding sprite, and rotate the directional neighbor rules. It must not silently change the behavior of existing explicit tile definitions.

## Configuration Limitations

[`ConfigLoader.validate()`](../../src/wfc/config-loader.ts) discovers tile IDs and validates neighbor references in the same pass. This currently rejects a neighbor reference to a tile declared later in the configuration. A two-pass validation process is required.

[`ConfigLoader.buildTileMapping()`](../../src/wfc/config-loader.ts) treats an omitted neighbor side as allowing every tile. An explicitly empty array remains empty.

## Performance Characteristics

- Minimum-entropy selection scans every cell per collapse.
- Grid snapshots copy every cell domain before each random collapse.
- Propagation uses `Array.shift()`, which is adequate for small grids but should be profiled before scaling.
- No priority queue, bitset domain representation, or cached compatibility lookup exists.

The current implementation is suitable for validating correctness on small maps. Performance work should follow tests, correct backtracking, and a working rendering path.

## Future Work

1. Fix two-pass configuration validation.
2. Implement alternative-choice backtracking.
3. Consider a separate rotation-derived tile-variants feature only if content authoring requires it.
4. Inject a seeded random source for reproducible solves.
5. Add a deterministic seeded floor-shape generator.
6. Add automated tests and benchmark representative maps.
