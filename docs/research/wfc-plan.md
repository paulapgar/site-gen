# Wave Function Collapse Roadmap

## Objective

Provide a reusable WFC module that creates tile-ID grids from directional tile rules, supports caller-provided layout constraints, and can be rendered in the Excalibur game.

The detailed implementation status is maintained in [wfc-plan-phase1.md](./wfc-plan-phase1.md). This document is the forward-looking roadmap.

## Current Baseline

The repository already contains:

- public WFC configuration, solution, constraint, and seeded-generator types in [`src/wfc/types.ts`](../../src/wfc/types.ts);
- a queue-propagating solver with weighted random collapse in [`src/wfc/wfc-engine.ts`](../../src/wfc/wfc-engine.ts);
- runtime constrained cells through `solve({ cellConstraints })`;
- JSON loading and partial validation in [`src/wfc/config-loader.ts`](../../src/wfc/config-loader.ts);
- a castle tile configuration in [`public/configs/castle-tiles.json`](../../public/configs/castle-tiles.json);
- a sprite-oriented integration helper in [`src/wfc/excalibur-integration.ts`](../../src/wfc/excalibur-integration.ts); and
- a deliberately throwing seeded-floor generator placeholder in [`src/wfc/seeded-floor-constraints.ts`](../../src/wfc/seeded-floor-constraints.ts).

The module is not yet integrated into an application scene, and no committed test suite exists.

## Design Decisions

### Directional tile rules

Each tile declares allowed neighbors separately for `top`, `bottom`, `left`, and `right`. This supports asymmetric visual tiles such as left and right walls.

An omitted side currently permits every configured tile. An explicitly empty neighbor list permits no tile on that side, which makes it usable only at a boundary unless another future boundary representation is added.

### Runtime constrained layouts

Map-specific decisions belong to the solve call, not the reusable tile JSON:

```ts
const solution = new WaveFunctionCollapse(config).solve({
  cellConstraints: [
    { x: 10, y: 8, allowedTileIds: ['floor'] },
    { x: 11, y: 8, allowedTileIds: ['floor'] },
  ],
});
```

This supports hand-authored masks, map-editor selections, objective rooms, and future procedural floor-shape generators.

### Seeded floor generation

A future deterministic generator accepts a numeric seed, grid dimensions, and floor tile IDs, then returns `WFCCellConstraint[]`. It does not directly mutate a WFC grid and does not alter tile-rule JSON.

The current `generateSeededFloorConstraints()` export is a placeholder that throws. It is an API boundary, not a working generator.

### Randomness

The current WFC solver uses `Math.random()`. It does not provide a seed or reproducible solutions. Reproducible completed maps require a future injectable or seeded random source in addition to deterministic floor-shape generation.

## Milestones

### 1. Correct and test the configuration boundary

- Fix forward-reference validation in `ConfigLoader.validate()`.
- Decide whether the engine constructor validates configurations itself.
- Add configuration fixtures and automated tests.

### 2. Complete the solver

- Track untried choices in backtracking decisions.
- Retry a decision with a different tile after a contradiction.
- Decide whether to expose the backtrack limit and random source as solve options.
- Add deterministic solver tests.

### 3. Consider rotation-derived tile variants after Phase 1

The unused global symmetry configuration and its partial validator were removed. They did not rotate sprites, generate tile variants, or simplify the explicitly oriented castle configuration.

If tile-authoring duplication becomes a problem, add a separate opt-in rotation-derived tile-variants feature. It should generate tile IDs, choose or transform sprites, rotate directional neighbor rules, and validate the resulting variants. This must remain separate from the core WFC configuration and is not a Phase 1 requirement.

### 4. Integrate with Excalibur

- Create a stable mapping from `WFCConfig.tiles` IDs to sprite-sheet indexes.
- Replace the sprite-only helper with a verified TileMap adapter, or document a different rendering approach.
- Add a game-scene example that loads the configuration, solves a grid, and renders it.

### 5. Implement seeded floor shapes

- Choose a deterministic PRNG.
- Implement a floor-mask algorithm behind `SeededFloorConstraintGenerator`.
- Test stable output for identical seeds.
- Test successful and unsatisfiable masks against the castle tile configuration.

### 6. Improve performance only after correctness

The current minimum-entropy scan is O(width × height) per collapse, and propagation uses an array queue. Profile realistic map sizes before adding a priority queue, bitsets, or cached compatibility maps.

## Out of Scope for the Current Baseline

- 3D WFC;
- animated-tile support;
- global semantic guarantees such as connected rooms or exactly one entrance;
- dynamic rerolling of already-rendered maps;
- automatic tile-rule learning from example images.

Those features should be planned only after the correctness, integration, and testing milestones above are complete.
