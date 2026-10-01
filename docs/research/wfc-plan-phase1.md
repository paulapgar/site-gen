# Phase 1: WFC Implementation Status and Completion Plan

## Purpose

Phase 1 establishes a reusable TypeScript Wave Function Collapse (WFC) module for the Excalibur project. It covers tile-rule configuration, a grid solver, constrained cells for authored or generated floor shapes, and an initial rendering adapter.

This document records the implementation that exists today and the remaining work required to finish Phase 1. Status labels describe repository state, not intended behavior.

## Current Status

| Area | Status | Current state |
|---|---|---|
| Public types and module exports | Complete | The WFC configuration, result, constrained-cell, and seeded-generator types are exported. |
| JSON loading and validation | Partial | JSON loading and several validation rules exist; forward tile references are currently rejected incorrectly. |
| Castle tile configuration | Partial | A substantial 20x20 castle configuration exists, but cannot be loaded through the current validator because it contains forward references. |
| Basic solver | Complete | The solver initializes domains, selects minimum-entropy cells, uses weighted random collapse, and reports complete or incomplete solutions. |
| Constraint propagation | Complete | Queue-based propagation runs to a fixed point after every domain change. |
| Runtime constrained WFC | Complete | Callers can fix or narrow individual cells before random collapse. |
| Backtracking | Partial | Grid snapshots are restored after contradictions, but failed choices are not excluded before retrying. |
| Rotation-derived tile variants | Deferred | The unused global symmetry API was removed. A future authoring feature may derive rotated tile variants explicitly. |
| Seeded floor-shape generation | Placeholder | The public placeholder throws until a deterministic shape generator is implemented. |
| Excalibur integration | Partial | The adapter builds sprites, not an Excalibur `TileMap`. |
| Application example and persistent tests | Not started | The WFC module is not used outside `src/wfc`, and no test suite is committed. |

## Current Public API

The public API is exported through [`src/wfc/wfc-model.ts`](../../src/wfc/wfc-model.ts).

### Tile-rule configuration

[`WFCConfig`](../../src/wfc/types.ts) describes the size of a generated grid and its tile definitions:

```ts
interface WFCConfig {
  gridWidth: number;
  gridHeight: number;
  tiles: TileTypeConfig[];
}
```

Each `TileTypeConfig` has an ID, a name, an optional sprite reference, an optional non-negative weight, and optional directional neighbor lists. When a neighbor side is omitted, [`ConfigLoader.buildTileMapping()`](../../src/wfc/config-loader.ts) treats that side as allowing every tile ID.

The current example is [`public/configs/castle-tiles.json`](../../public/configs/castle-tiles.json). It defines a 20x20 castle-oriented set including floor, grass, walls, corners, archways, and turrets.

### Solving

[`WaveFunctionCollapse`](../../src/wfc/wfc-engine.ts) accepts an in-memory `WFCConfig`:

```ts
const wfc = new WaveFunctionCollapse(config);
const solution = wfc.solve();
```

`solve()` creates a fresh grid for every call. A result contains:

```ts
interface WFCSolution {
  grid: string[][];
  complete: boolean;
  backtrackCount: number;
}
```

An incomplete solution contains empty strings for unresolved cells. The engine does not currently log contradictions or expose a structured failure reason.

### Constrained WFC

Use `cellConstraints` to seed cells before entropy-driven collapse:

```ts
const solution = new WaveFunctionCollapse(config).solve({
  cellConstraints: [
    { x: 4, y: 3, allowedTileIds: ['floor'] },
    { x: 5, y: 3, allowedTileIds: ['floor'] },
    { x: 6, y: 3, allowedTileIds: ['floor'] },
  ],
});
```

[`WFCCellConstraint`](../../src/wfc/types.ts) has zero-based `x` and `y` coordinates plus one or more allowed tile IDs.

- A single allowed ID fixes a cell.
- Multiple IDs narrow a cell without fixing its exact variant.
- Multiple constraints for the same coordinate are intersected.
- Invalid coordinates, unknown tile IDs, empty allowed lists, and incompatible repeated constraints throw `Error`.
- Valid but unsatisfiable shapes return an incomplete `WFCSolution`.
- Constraints propagate before the first random collapse.

This API keeps reusable tile rules in JSON and supplies map-specific layout decisions at solve time.

### Seeded floor-shape extension point

[`SeededFloorConstraintGenerator`](../../src/wfc/types.ts) defines a deterministic generator contract:

```ts
interface SeededFloorConstraintGenerator {
  generate(
    options: SeededFloorConstraintGenerationOptions
  ): readonly WFCCellConstraint[];
}
```

The exported [`generateSeededFloorConstraints()`](../../src/wfc/seeded-floor-constraints.ts) is deliberately a placeholder and throws an explicit error. It must not be called in production until a seeded shape algorithm is implemented. The future implementation should return cell constraints that are passed to `solve({ cellConstraints })`.

## Implemented Solver Behavior

[`WaveFunctionCollapse.solve()`](../../src/wfc/wfc-engine.ts) currently does the following:

1. Creates a fresh grid where every cell initially permits every tile.
2. Applies and combines requested cell constraints.
3. Propagates constrained domains through neighboring cells until no domains change.
4. Selects the first uncollapsed cell with the smallest domain.
5. Uses `Math.random()` and tile weights to choose one allowed tile.
6. Propagates the new single-tile domain through a queue.
7. Returns a complete solution when every cell is collapsed.
8. Restores the latest snapshot after a contradiction, up to a private limit of 1,000 backtracks.

Propagation uses each source tile's directional allowed-neighbor set. For a multi-tile source domain, it permits the union of neighbors allowed by all remaining source tiles. A cell becomes collapsed automatically when propagation leaves exactly one possibility.

The engine is not deterministic: it uses `Math.random()` for collapse selection. A future floor-shape generator may be deterministic for a supplied seed, but that alone will not make the completed WFC solution deterministic.

## Component Status

### `src/wfc/types.ts` — complete

Contains the public configuration, constraint, solve-option, seeded-generator, grid, internal tile, snapshot, and solution types.

### `src/wfc/config-loader.ts` — partial

Implemented:

- `loadFromPath()` fetches JSON and validates it.
- `validate()` checks dimensions, non-empty tiles, duplicate IDs and names, non-negative weights, and neighbor-list array shapes.
- `buildTileMapping()` creates internal `Set`-based directional constraints.

Known limitations:

- Neighbor references are checked while tile IDs are still being discovered. A tile may currently reference only an ID that appears earlier in the JSON array. The castle configuration references `grass` before its declaration, so `loadFromPath()` rejects it.
- Constructing `WaveFunctionCollapse` directly does not call `ConfigLoader.validate()`.
- Directional neighbor rules are explicit. The removed global symmetry API did not rotate sprites, generate tile variants, or add missing neighbor rules.

### `src/wfc/wfc-engine.ts` — partial completion

Implemented:

- Minimum-domain entropy selection.
- Weighted random tile selection.
- Queue-based propagation.
- Constrained cells, including multi-option cells.
- Grid snapshots and restoration.
- Reuse of one engine instance across independent `solve()` calls.

Known limitation:

- Snapshot restoration does not record or remove the failed choice. A retry can select the same tile again, so the current backtracking behavior is not a complete search strategy.

### `src/wfc/excalibur-integration.ts` — partial

Implemented:

- `spritesFromSolution()` creates a flat `Sprite[]` from a solution and supplied sprite sheet.
- `buildTileSpriteSheet()` creates sprites from provided image references.

Not implemented:

- Converting a `WFCSolution` into an Excalibur `TileMap`.
- A stable mapping from configured tile IDs to sprite-sheet indexes. `spritesFromSolution()` assigns indexes in first-seen solution order.
- Resource loading and scene integration.

### `src/wfc/wfc-model.ts` — complete

Re-exports the engine, loader, adapter, seeded-generator placeholder, and public types.

## Remaining Phase 1 Work

### Milestone 1: Configuration correctness

1. Validate all tile IDs in a first pass, then validate neighbor references in a second pass.
2. Validate direct constructor input or document that callers must validate configurations before construction.
3. Add regression tests for valid forward references, invalid references, duplicate IDs, empty neighbor lists, and omitted neighbor sides.

### Milestone 2: Solver correctness

1. Replace snapshot-only backtracking with decision records containing untried alternatives.
2. Exclude a failed tile before retrying the decision.
3. Define whether `maxBacktracks` should be configurable through public options.
4. Add deterministic tests by injecting or abstracting the random source.

### Deferred: Rotation-derived tile variants

The global `WFCConfig.symmetry` option and its partial validator were removed because they did not transform sprites, generate rotated tile IDs, or simplify the explicitly oriented castle tiles.

If future content authoring benefits from defining one canonical tile and deriving rotations, implement a separate opt-in rotation-derived tile-variants feature. It should:

1. generate distinct rotated tile IDs;
2. select or transform the matching sprite;
3. rotate directional neighbor rules and any collision metadata; and
4. validate generated variants against explicit tile definitions.

This is not required to complete Phase 1. Explicit directional tile definitions remain the current model.

### Milestone 4: Rendering and integration

1. Define a stable tile-ID-to-sprite mapping from `WFCConfig.tiles`.
2. Implement an Excalibur `TileMap` conversion compatible with the installed Excalibur version.
3. Add a scene-level example that loads the castle configuration, runs WFC, and renders the result.
4. Verify the generated castle visually in the running application.

### Milestone 5: Seeded map generation

1. Select a seeded pseudo-random-number generator.
2. Implement deterministic floor-shape generation behind `SeededFloorConstraintGenerator`.
3. Test that identical generator inputs yield identical cell constraints.
4. Keep generated shape constraints separate from generic tile-rule JSON.

## Test Plan

No repository test runner is currently configured. When one is added, cover:

- basic solve completion for a single-tile configuration;
- weighted selection with a controlled random source;
- propagation in all four directions;
- contradiction detection and alternate-choice backtracking;
- fresh state on repeated `solve()` calls;
- fixed and multi-option constrained cells;
- invalid and conflicting cell constraints;
- satisfiable and unsatisfiable seeded floor masks;
- configuration loading, forward references, and omitted neighbor sides;
- rotation-derived tile variants, if that future feature is implemented;
- sprite mapping and TileMap conversion once implemented.

Until automated tests exist, build with `npm run build` and use a scene-level example for visual verification.
