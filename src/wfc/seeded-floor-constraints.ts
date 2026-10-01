import { SeededFloorConstraintGenerationOptions, WFCCellConstraint } from './types';

/**
 * Placeholder for deterministic random floor-shape generation.
 *
 * Replace this implementation with a seeded shape generator, then pass its
 * returned constraints to `WaveFunctionCollapse.solve({ cellConstraints })`.
 */
export function generateSeededFloorConstraints(
  _options: SeededFloorConstraintGenerationOptions
): readonly WFCCellConstraint[] {
  throw new Error(
    'Seeded floor-shape generation is not implemented. Generate WFCCellConstraint values and pass them to solve({ cellConstraints }).'
  );
}
