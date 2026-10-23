# Phase 1: WFC Implementation Status

## Purpose and Status

Phase 1 establishes a reusable TypeScript Wave Function Collapse (WFC) module for the Excalibur project: configurable tile rules and output, a constrained solver, and an initial rendered castle layout.

The implementation and initial scene integration are in place. The user reports completing a visual review, including an agent preview, and confirms that the generated layout works correctly. No layout tuning is currently indicated. The next proposed WFC work is implementing the seeded floor-shape generator, which remains a separate placeholder.

| Area | Status | Current state |
|---|---|---|
| Public types and module exports | Complete | Configuration, solution, solve-option, constrained-cell, and seeded-generator types are exported. |
| JSON loading and validation | Complete | Configuration validation supports forward tile references. |
| Castle configuration and spritemap | Complete | The linked 20×20 atlas configuration includes directional castle rules and visual references; output dimensions are separately configurable. |
| Solver and propagation | Complete | Weighted collapse, directional queue propagation, alternative-choice backtracking, and injected randomness are implemented. |
| Runtime cell constraints | Complete | Constraints can fix or narrow cells before collapse and propagate before random choices. |
| Grass perimeter | Implemented | The outer edge is constrained to grass; the 20×15 map has 66 perimeter cells. Grass adjacency includes orientation-matched corner and turret tiles. |
| Castle layout constraints | Implemented | The active blueprint is a centered plus with a constrained rim and bottom-center archway; details follow below. |
| Inner-corner rules and sprite | Implemented | All four inner-corner definitions and directional rules are connected. `inner_corner_br` maps to atlas row 5, column 0. |
| Scene rendering | Implemented | The scene solves and renders the configured map as a centered Excalibur `TileMap`. |
| Manual visual assessment | Complete (user-reported) | The user reports reviewing the generated layout, including an agent preview, and confirms that it works correctly. |
| Seeded floor-shape generation | Placeholder | `generateSeededFloorConstraints()` intentionally throws; it is separate from the working castle-layout generator. |
| Automated test runner | Deferred | Vitest/test-runner setup is intentionally deferred for the user to add later. |

## Configuration, Solver, and Rendering

The public API is exported through [`src/wfc/wfc-model.ts`](../../src/wfc/wfc-model.ts). The active castle configuration and sprite map are [`public/configs/castle-tiles.json`](../../public/configs/castle-tiles.json) and [`public/configs/spritemap.json`](../../public/configs/spritemap.json).

### Dimensions and atlas

The generated grid uses configurable `gridWidth` and `gridHeight`; the active scene configuration is 20 columns × 15 rows. The castle atlas is 20×20. These are separate dimensions: atlas dimensions describe sprite placement, not WFC output size.

### Solver behavior

`WaveFunctionCollapse.solve()` initializes a fresh grid, applies optional cell constraints, propagates directional compatibility, and repeatedly collapses a minimum-domain cell using weighted selection. On contradiction it restores a decision point and tries an untried alternative. The solve options accept an injected random source; callers can supply a seeded source when reproducibility is required.

The solver enforces local directional tile compatibility. It does not independently guarantee global properties such as connected floor regions.

### Active castle blueprint

The scene combines `generateGrassPerimeterConstraints()` with `generateCastleLayoutConstraints()` before solving:

- The floor footprint is a centered plus. Its vertical and horizontal spans are each 10 cells, and its thickness is 3 cells. Their overlap yields 51 floor cells on the current 20×15 grid.
- The footprint is fixed to `floor`; floor is excluded outside it.
- The corresponding rim is constrained with 8 convex corner positions, allowing oriented corner/turret variants, and 4 concave positions using the four connected inner-corner definitions.
- Directional straight-rim choices retain compatible wall/archway variants and configured weights. A bottom-center `archway_h_bottom` is retained.
- The outermost grid cells are fixed to grass. Grass adjacency includes the orientation-matched corner and turret tiles needed at the perimeter.

The user reports that visual review, including an agent preview, confirmed the generated composition works correctly. This records the user's review; it is not an independent assessment by this document's author.

### Scene integration

The existing scene loads the WFC configuration and sprite map, solves the combined constraints, maps configured tile IDs to their sprites, and adds the result to a centered Excalibur `TileMap`. The map dimensions come from the WFC configuration, not the atlas.

## Remaining and Future Work

### Proposed next phase: implement seeded floor-shape generation

1. Define the intended shape characteristics and any required guarantees, such as connectivity and how shapes should respect grid boundaries.
2. Implement `generateSeededFloorConstraints()` using its existing seed, grid-dimension, and floor-tile inputs. Keep generated layout constraints separate from generic tile-rule JSON and pass them through `solve({ cellConstraints })`.
3. Check that identical inputs produce identical constraints and that generated constraints respect the chosen shape rules and grid bounds. If reproducibility of the final collapsed grid is required, provide a seeded random source to `solve()` separately.
4. Add focused automated coverage after the user introduces the deferred test runner.

The reported visual review found the current plus layout works correctly, so no tuning is currently indicated. Revisit its geometry or tile weights only if a concrete issue or new requirement arises. Vitest and the test runner remain intentionally deferred for the user to add later. The latest reported build, lint, format, focused solver validation, and HTTP preview checks passed.

### Seeded floor-shape extension

`SeededFloorConstraintGenerator` reserves the API boundary, but `generateSeededFloorConstraints()` remains a throwing placeholder. Its options already provide a seed, grid dimensions, and floor tile IDs. The generator should return `WFCCellConstraint[]` for `solve({ cellConstraints })` without changing generic tile-rule JSON; the proposed next phase above outlines the remaining work.

### Conditional rotation-derived variants

The former global symmetry option was removed because it did not transform sprites, create tile variants, or add directional neighbor rules. Explicitly oriented castle tiles remain the current model. If authoring duplication later justifies it, a separate opt-in feature could generate rotated IDs, matching sprite references, and rotated directional rules.

### Performance

Defer optimization until profiling demonstrates a need at realistic map sizes. The minimum-entropy scan, grid snapshots, and propagation queue can be evaluated then.
