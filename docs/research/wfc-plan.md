# Wave Function Collapse Roadmap

## Objective

Provide a reusable WFC module that creates tile-ID grids from directional tile rules, accepts caller-provided layout constraints, and renders generated maps in the Excalibur game.

The implementation record and near-term phase are maintained in [wfc-plan-phase1.md](./wfc-plan-phase1.md).

## Current Baseline

- The public WFC types support configurable output dimensions, solve-time cell constraints, and an injectable random source.
- `ConfigLoader` validates forward neighbor references.
- The solver propagates directional constraints, performs weighted collapse, backtracks through untried alternatives, and accepts injected randomness.
- The linked castle tile configuration and spritemap describe a 20×20 atlas; the generated castle map is independently configured as 20×15.
- The existing scene loads the castle configuration, combines grass-perimeter and castle-layout constraints, solves the grid, and renders it in a centered Excalibur `TileMap`.
- The active blueprint is a centered plus: its horizontal and vertical spans are each 10 cells, with 3-cell thickness. On the current 20×15 grid this yields 51 floor cells. The WFC constraints shape its corresponding rim, retain a bottom-center archway, constrain the outer edge to grass, and exclude floor outside the footprint.
- Grass adjacency includes orientation-matched corner and turret tiles. All four inner-corner WFC definitions and their directional rules are connected; the `inner_corner_br` sprite mapping is corrected to atlas row 5, column 0.
- The seeded floor-shape generator remains an intentional throwing placeholder. It is separate from the working castle-layout constraint generator.
- Vitest and a test runner remain intentionally deferred for the user to add later.

The latest reported build, lint, format, focused solver validation, and HTTP preview checks passed. The user reports completing a visual review, including an agent preview, and confirms that the generated plus layout works correctly. No layout tuning is currently indicated.

## Design Decisions

### Directional tile rules

Each tile declares allowed neighbors separately for `top`, `bottom`, `left`, and `right`. This supports asymmetric visual tiles such as oriented walls and corners. An omitted side permits every configured tile; an explicitly empty neighbor list permits none on that side.

### Output and atlas dimensions

WFC output dimensions are configurable through `gridWidth` and `gridHeight`. The active castle output is 20 columns × 15 rows. The castle atlas is 20×20; those atlas dimensions do not define the generated grid.

### Runtime constrained layouts

Map-specific decisions belong to the solve call rather than reusable tile-rule JSON. The grass perimeter and castle plus-layout generator provide the current constraints. The plus-layout generator is a specific initial blueprint, not a general profile system.

### Randomness and seeded shapes

The solver accepts an injected random source; callers can provide a seeded source when reproducible solves are needed. The separate `generateSeededFloorConstraints()` API remains unimplemented and throws. A future floor-shape generator should return constraints without changing generic tile rules.

## Milestones

### 1. Configuration boundary — implemented

- Forward references are supported by configuration validation.
- The linked castle tile rules and spritemap provide adjacency and visual references.
- The 20×20 atlas and configurable 20×15 generated map remain distinct.

### 2. Solver recovery and randomness — implemented

- Backtracking retries untried tile alternatives after contradictions.
- The random source is injectable; weighted selection remains in use.
- The solver supports runtime cell constraints and directional propagation.

### 3. Scene rendering and initial castle layout — implemented; visual review complete (user-reported)

- The scene loads the linked castle configuration and spritemap, solves the constrained grid, and renders a centered `TileMap`.
- The current 20×15 layout uses the centered plus blueprint, grass perimeter, constrained rim, and bottom-center archway described above.
- The user reports reviewing the generated layout, including an agent preview, and confirms that it works correctly. This is a user-reported result, not an independent visual assessment by this document's author.

### 4. Visual follow-up — conditional

- No tuning is currently indicated by the reported review.
- Revisit geometry or tile weights only if a concrete visual issue or new requirement arises.
- Consider layout-profile abstractions only if additional real layouts demonstrate a need.

### 5. Proposed next work: implement seeded floor shapes

1. Define the desired shape characteristics and guarantees, including whether generated shapes must be connected and how they handle grid boundaries.
2. Implement `generateSeededFloorConstraints()` behind `SeededFloorConstraintGenerator`, using the existing seed, grid dimensions, and allowed floor tile IDs.
3. Keep generated shape constraints separate from generic tile-rule JSON and pass them to `solve({ cellConstraints })`.
4. Check deterministic constraint output, grid bounds, and the chosen shape rules. For reproducible final grids, also pass a seeded random source to the solver.
5. Add focused coverage once the user introduces the deferred test runner.

### 6. Consider rotation-derived tile variants — conditional future work

The unused global symmetry configuration was removed; it did not rotate sprites, generate tile variants, or simplify the explicitly oriented castle configuration. If tile-authoring duplication becomes a demonstrated problem, consider a separate opt-in feature that derives tile IDs, sprite mappings, and rotated directional rules. It is not required for the current implementation.

### 7. Improve performance only after need is demonstrated

Profile realistic map sizes before adding a priority queue, bitsets, or cached compatibility maps. Prioritize observed correctness or performance needs rather than speculative optimization.

## Out of Scope

- 3D WFC;
- animated-tile support;
- global semantic guarantees such as connected rooms or exactly one entrance;
- dynamic rerolling of already-rendered maps; and
- automatic tile-rule learning from example images.

Plan these only if later project requirements call for them.
