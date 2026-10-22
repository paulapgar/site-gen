import type { SeededFloorConstraintGenerationOptions, WFCCellConstraint } from './types';

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

/**
 * Constrain a centered plus-shaped castle floor and its one-cell wall rim.
 *
 * The outer grass perimeter is intentionally kept separate so it can be
 * combined with these layout constraints by the caller. Every cell outside
 * the floor excludes floor, while rim domains retain the configured WFC
 * weights for compatible wall, archway, and corner variants.
 */
export function generateCastleLayoutConstraints(
  gridWidth: number,
  gridHeight: number
): readonly WFCCellConstraint[] {
  if (
    !Number.isInteger(gridWidth) ||
    gridWidth <= 0 ||
    !Number.isInteger(gridHeight) ||
    gridHeight <= 0
  ) {
    throw new Error('Grid dimensions must be positive integers');
  }
  const armLength = 10;
  const armThickness = 3;
  if (gridWidth < armLength + 4 || gridHeight < armLength + 4) {
    throw new Error(
      `Grid dimensions must be at least ${armLength + 4}x${armLength + 4} for the plus floor, wall rim, and grass border`
    );
  }

  // For even-sized grids, horizontal arms and the vertical span are centered
  // with the extra cell on the low-index side. The three-cell crossing uses
  // the lower of the two center columns/rows.
  const horizontalLeft = Math.floor((gridWidth - armLength) / 2);
  const verticalTop = Math.floor((gridHeight - armLength) / 2);
  const verticalCenterX = Math.floor((gridWidth - 1) / 2);
  const horizontalCenterY = Math.floor((gridHeight - 1) / 2);
  const verticalLeft = verticalCenterX - Math.floor(armThickness / 2);
  const horizontalTop = horizontalCenterY - Math.floor(armThickness / 2);
  const verticalBottom = verticalTop + armLength - 1;
  const floorCells = new Set<string>();
  const keyFor = (x: number, y: number): string => `${x},${y}`;
  const addFloorRectangle = (left: number, top: number, width: number, height: number): void => {
    for (let y = top; y < top + height; y++) {
      for (let x = left; x < left + width; x++) {
        floorCells.add(keyFor(x, y));
      }
    }
  };

  addFloorRectangle(verticalLeft, verticalTop, armThickness, armLength);
  addFloorRectangle(horizontalLeft, horizontalTop, armLength, armThickness);

  const constraints: WFCCellConstraint[] = [];
  const addConstraint = (x: number, y: number, allowedTileIds: readonly string[]): void => {
    constraints.push({ x, y, allowedTileIds });
  };
  let convexCornerCount = 0;
  let concaveCornerCount = 0;

  const orthogonalNeighbors = [
    { dx: 0, dy: -1, direction: 'north' },
    { dx: 0, dy: 1, direction: 'south' },
    { dx: -1, dy: 0, direction: 'west' },
    { dx: 1, dy: 0, direction: 'east' },
  ] as const;
  const straightRimDomains: Record<(typeof orthogonalNeighbors)[number]['direction'], string[]> = {
    north: ['wall_h_bottom', 'archway_h_bottom'],
    south: ['wall_h_top', 'archway_h_top'],
    west: ['wall_v_right', 'archway_v_right'],
    east: ['wall_v_left', 'archway_v_left'],
  };
  const innerCornerByFloorDirections: Record<string, string> = {
    'east,south': 'inner_corner_tl',
    'south,west': 'inner_corner_tr',
    'east,north': 'inner_corner_bl',
    'north,west': 'inner_corner_br',
  };
  const convexCornerByDiagonal: Record<string, string[]> = {
    '1,1': ['corner_tl', 'turret_tl'],
    '-1,1': ['corner_tr', 'turret_tr'],
    '1,-1': ['corner_bl', 'turret_bl'],
    '-1,-1': ['corner_br', 'turret_br'],
  };
  const nonFloorTileIds = [
    'wall_h_top',
    'wall_h_bottom',
    'wall_v_left',
    'wall_v_right',
    'archway_v_left',
    'archway_v_right',
    'archway_h_top',
    'archway_h_bottom',
    'corner_tl',
    'corner_tr',
    'corner_bl',
    'corner_br',
    'turret_tl',
    'turret_tr',
    'turret_bl',
    'turret_br',
    'inner_corner_tl',
    'inner_corner_tr',
    'inner_corner_bl',
    'inner_corner_br',
    'grass',
  ];

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (floorCells.has(keyFor(x, y))) {
        addConstraint(x, y, ['floor']);
        continue;
      }

      const floorDirections = orthogonalNeighbors.filter(({ dx, dy }) =>
        floorCells.has(keyFor(x + dx, y + dy))
      );
      if (floorDirections.length === 1) {
        let allowedTileIds = straightRimDomains[floorDirections[0].direction];
        if (x === verticalCenterX && y === verticalBottom + 1) {
          allowedTileIds = ['archway_h_bottom'];
        }
        addConstraint(x, y, allowedTileIds);
        continue;
      }
      if (floorDirections.length === 2) {
        const directions = floorDirections
          .map(({ direction }) => direction)
          .sort()
          .join(',');
        const innerCorner = innerCornerByFloorDirections[directions];
        if (!innerCorner) {
          throw new Error(`Plus floor has an unsupported concave rim at (${x}, ${y})`);
        }
        concaveCornerCount++;
        addConstraint(x, y, [innerCorner]);
        continue;
      }
      if (floorDirections.length > 2) {
        throw new Error(`Plus floor has an unsupported rim junction at (${x}, ${y})`);
      }

      const diagonalFloors = [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].filter(([dx, dy]) => floorCells.has(keyFor(x + dx, y + dy)));
      if (diagonalFloors.length === 1) {
        const [dx, dy] = diagonalFloors[0];
        const convexCorner = convexCornerByDiagonal[`${dx},${dy}`];
        if (!convexCorner) {
          throw new Error(`Plus floor has an unsupported convex rim at (${x}, ${y})`);
        }
        convexCornerCount++;
        addConstraint(x, y, convexCorner);
        continue;
      }

      if (diagonalFloors.length > 1) {
        throw new Error(`Plus floor has an ambiguous convex rim at (${x}, ${y})`);
      }

      // Excluding floor everywhere outside its footprint prevents additional
      // floor patches from appearing beyond the explicitly constrained rim.
      addConstraint(x, y, nonFloorTileIds);
    }
  }

  if (convexCornerCount !== 8 || concaveCornerCount !== 4) {
    throw new Error(
      `Plus floor produced ${convexCornerCount} convex and ${concaveCornerCount} concave rim cells; expected 8 and 4`
    );
  }

  return constraints;
}

/**
 * Restrict every cell on the grid's outer edge to the grass tile.
 *
 * The generated constraints include each perimeter coordinate once, including
 * corners, and can be combined with other cell constraints in a WFC solve.
 */
export function generateGrassPerimeterConstraints(
  gridWidth: number,
  gridHeight: number
): readonly WFCCellConstraint[] {
  if (
    !Number.isInteger(gridWidth) ||
    gridWidth <= 0 ||
    !Number.isInteger(gridHeight) ||
    gridHeight <= 0
  ) {
    throw new Error('Grid dimensions must be positive integers');
  }

  const constraints: WFCCellConstraint[] = [];
  const addGrassConstraint = (x: number, y: number): void => {
    constraints.push({ x, y, allowedTileIds: ['grass'] });
  };

  for (let x = 0; x < gridWidth; x++) {
    addGrassConstraint(x, 0);
    if (gridHeight > 1) {
      addGrassConstraint(x, gridHeight - 1);
    }
  }

  for (let y = 1; y < gridHeight - 1; y++) {
    addGrassConstraint(0, y);
    if (gridWidth > 1) {
      addGrassConstraint(gridWidth - 1, y);
    }
  }

  return constraints;
}
