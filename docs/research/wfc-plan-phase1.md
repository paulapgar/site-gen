# Phase 1: WFC Implementation Status

## Purpose and Status

Phase 1 establishes a reusable TypeScript Wave Function Collapse (WFC) module for the Excalibur project: configurable tile rules and output, a constrained solver, and an initial rendered castle layout.

The implementation and initial scene integration are in place. The next proposed phase is manual visual inspection and, only if observations warrant it, tuning of the plus layout. The layout has not yet been visually assessed.

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
| Manual visual assessment | Pending | No browser or screenshot assessment of the plus layout has been performed. |
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

The solver constraints and successful preview response do not prove that the generated composition looks correct. Manual visual inspection remains pending.

### Scene integration

The existing scene loads the WFC configuration and sprite map, solves the combined constraints, maps configured tile IDs to their sprites, and adds the result to a centered Excalibur `TileMap`. The map dimensions come from the WFC configuration, not the atlas.

## Remaining and Future Work

### Proposed next phase: visual inspection and tuning

1. Inspect the running 20×15 scene in a browser or screenshot.
2. Assess centering and proportions, the floor/rim junctions, corner and turret variety, the bottom-center archway, grass perimeter, and negative space.
3. Change layout geometry or tile weights only to address issues actually observed. Consider profile abstractions only if the inspection or additional real layouts demonstrate that they are useful.
4. Record visual findings and any resulting adjustments; until then, do not describe the plus as visually verified.

Vitest and the test runner remain intentionally deferred for the user to add later. The latest reported build, lint, format, focused solver validation, and HTTP preview checks passed; an HTTP response is not a substitute for visual inspection.

### Seeded floor-shape extension

`SeededFloorConstraintGenerator` reserves an API boundary, but `generateSeededFloorConstraints()` remains a throwing placeholder. Future work may select a deterministic shape algorithm and return `WFCCellConstraint[]` for `solve({ cellConstraints })`, keeping generated layout constraints separate from generic tile-rule JSON. Automated coverage can be added after the user introduces the deferred test runner.

### Conditional rotation-derived variants

The former global symmetry option was removed because it did not transform sprites, create tile variants, or add directional neighbor rules. Explicitly oriented castle tiles remain the current model. If authoring duplication later justifies it, a separate opt-in feature could generate rotated IDs, matching sprite references, and rotated directional rules.

### Performance

Defer optimization until profiling demonstrates a need at realistic map sizes. The minimum-entropy scan, grid snapshots, and propagation queue can be evaluated then.
