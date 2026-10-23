# TODO List for Site Generator

## Wave Function Collapse Castle Generation

### Current status

- [x] Implement the reusable WFC solver, runtime cell constraints, and castle scene integration.
- [x] Generate and render the current 20×15 centered-plus castle layout with a grass perimeter.
- [x] Complete visual review of the generated layout. The user reports reviewing it, including an agent preview, and confirms that it works correctly.

### Next WFC work

- [ ] Define the intended deterministic floor-shape behavior: shape characteristics, grid-boundary handling, and any required properties such as connectivity.
- [ ] Implement `generateSeededFloorConstraints()` using its existing seed, grid-dimension, and floor-tile inputs. Return cell constraints for `solve({ cellConstraints })` and keep shape generation separate from generic tile-rule configuration.
- [ ] Check that identical generator inputs produce identical constraints and that the output respects the chosen shape rules and grid bounds. If reproducibility of the final collapsed grid is required, provide a seeded random source to `solve()` as well.
- [ ] After a test runner is introduced, add focused tests for deterministic generation and valid constraint output.

### Deferred or conditional

- Automated test-runner setup remains deferred for the user to add later.
- Revisit the plus layout only if a concrete visual issue or new requirement arises; no tuning is currently indicated by the reported review.
- Consider rotation-derived tile variants only if tile-authoring duplication becomes a demonstrated problem.
- Profile before pursuing WFC performance optimizations.
