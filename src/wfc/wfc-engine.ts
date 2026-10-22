import {
  WFCConfig,
  GridCell,
  TileTypeInternal,
  WFCSolution,
  GridSnapshot,
  NeighborSide,
  WFCCellConstraint,
  WFCSolveOptions,
} from './types';
import { ConfigLoader } from './config-loader';

interface GridPosition {
  x: number;
  y: number;
}

interface DecisionFrame {
  snapshot: GridSnapshot;
  x: number;
  y: number;
  alternatives: string[];
  nextAlternativeIndex: number;
}

/**
 * Wave Function Collapse engine for tile-based pattern generation.
 *
 * Implements the WFC algorithm with entropy-based cell selection,
 * constraint propagation, and backtracking on contradiction.
 *
 * @example
 * ```ts
 * const config = { gridWidth: 16, gridHeight: 16, tiles: [...] };
 * const wfc = new WaveFunctionCollapse(config);
 * const solution = wfc.solve({
 *   cellConstraints: [{ x: 4, y: 3, allowedTileIds: ['floor'] }],
 * });
 * ```
 */
export class WaveFunctionCollapse {
  /** Grid width in cells. */
  private gridWidth: number;

  /** Grid height in cells. */
  private gridHeight: number;

  /** Map of tile ID to tile definition. */
  private tileTypes: Map<string, TileTypeInternal>;

  /** 2D grid of cells tracking possibilities and collapse state. */
  private grid: GridCell[][];

  /** Maximum allowed backtracks before returning an incomplete solution. */
  private maxBacktracks: number = 1000;

  /** Number of backtracking operations performed during solve. */
  private backtrackCount: number = 0;

  /** Decision points and untried tile alternatives used for backtracking. */
  private decisions: DecisionFrame[] = [];

  /**
   * Create a new WFC engine instance.
   *
   * @param config - Configuration defining grid dimensions, tiles, and constraints.
   */
  constructor(config: WFCConfig) {
    this.gridWidth = config.gridWidth;
    this.gridHeight = config.gridHeight;
    this.tileTypes = ConfigLoader.buildTileMapping(config);
    this.grid = this.initializeGrid();
  }

  /**
   * Run the full WFC algorithm until completion, contradiction, or max iterations.
   *
   * @param options - Optional cell constraints applied before random collapse.
   * @returns A {@link WFCSolution} containing the resolved grid and metadata.
   * @throws {Error} If a cell constraint has invalid coordinates, tile IDs, or no allowed tiles.
   */
  solve(options: WFCSolveOptions = {}): WFCSolution {
    this.grid = this.initializeGrid();
    this.backtrackCount = 0;
    this.decisions = [];
    const randomSource = options.random ?? Math.random;

    const constrainedCells = this.applyCellConstraints(options.cellConstraints ?? []);
    if (!this.propagateConstraints(constrainedCells)) {
      return this.createIncompleteSolution();
    }

    const maxIterations = this.gridWidth * this.gridHeight * 10;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Find the non-collapsed cell with lowest entropy
      const targetCell = this.findLowestEntropyCell();

      if (!targetCell) {
        // No more cells to collapse - solution complete
        const grid = this.grid.map((row) => row.map((cell) => cell.resolvedTileId ?? ''));
        if (grid.some((row) => row.some((tileId) => tileId.length === 0))) {
          return this.createIncompleteSolution();
        }
        return {
          grid,
          complete: true,
          backtrackCount: this.backtrackCount,
        };
      }

      const { x, y } = targetCell;
      const alternatives = this.weightedRandomOrder(
        Array.from(this.grid[y][x].possibilities),
        randomSource
      );
      if (alternatives.length === 0) {
        if (!this.backtrack()) {
          return this.createIncompleteSolution();
        }
        continue;
      }

      // Record untried alternatives before committing the first weighted choice.
      this.decisions.push({
        snapshot: this.takeSnapshot(),
        x,
        y,
        alternatives,
        nextAlternativeIndex: 1,
      });
      this.updateCellPossibilities(this.grid[y][x], new Set([alternatives[0]]));

      if (!this.propagateConstraints([{ x, y }])) {
        // Contradiction detected - retry an untried alternative if possible.
        if (!this.backtrack()) {
          return this.createIncompleteSolution();
        }
      }
    }

    // Max iterations reached
    return this.createIncompleteSolution();
  }

  /**
   * Initialize the grid with all tile possibilities for every cell.
   *
   * @returns A 2D array of {@link GridCell} instances, each containing the full set of tile IDs.
   */
  private initializeGrid(): GridCell[][] {
    const grid: GridCell[][] = [];

    for (let y = 0; y < this.gridHeight; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        const possibilities = new Set<string>(this.tileTypes.keys());
        row.push({
          possibilities,
          collapsed: false,
          resolvedTileId: undefined,
        });
      }
      grid.push(row);
    }

    return grid;
  }

  /**
   * Validate, combine, and apply caller-provided cell constraints.
   *
   * @param cellConstraints - Constraints to apply to the newly initialized grid.
   * @returns Coordinates whose possibilities were restricted.
   */
  private applyCellConstraints(cellConstraints: readonly WFCCellConstraint[]): GridPosition[] {
    if (!Array.isArray(cellConstraints)) {
      throw new Error('cellConstraints must be an array');
    }

    const constraintsByCell = new Map<
      string,
      { position: GridPosition; allowedTileIds: Set<string> }
    >();

    for (let index = 0; index < cellConstraints.length; index++) {
      const constraint = cellConstraints[index];
      if (typeof constraint !== 'object' || constraint === null) {
        throw new Error(`Cell constraint at index ${index} must be an object`);
      }
      if (
        !Number.isInteger(constraint.x) ||
        !Number.isInteger(constraint.y) ||
        constraint.x < 0 ||
        constraint.x >= this.gridWidth ||
        constraint.y < 0 ||
        constraint.y >= this.gridHeight
      ) {
        throw new Error(`Cell constraint at index ${index} has coordinates outside the grid`);
      }
      if (!Array.isArray(constraint.allowedTileIds) || constraint.allowedTileIds.length === 0) {
        throw new Error(`Cell constraint at index ${index} must allow at least one tile ID`);
      }

      const allowedTileIds = new Set<string>();
      for (const tileId of constraint.allowedTileIds) {
        if (typeof tileId !== 'string' || !this.tileTypes.has(tileId)) {
          throw new Error(
            `Cell constraint at index ${index} references invalid tile ID: ${tileId}`
          );
        }
        allowedTileIds.add(tileId);
      }

      const key = `${constraint.x},${constraint.y}`;
      const existingConstraint = constraintsByCell.get(key);
      if (!existingConstraint) {
        constraintsByCell.set(key, {
          position: { x: constraint.x, y: constraint.y },
          allowedTileIds,
        });
        continue;
      }

      const combinedTileIds = new Set(
        [...existingConstraint.allowedTileIds].filter((tileId) => allowedTileIds.has(tileId))
      );
      if (combinedTileIds.size === 0) {
        throw new Error(
          `Cell constraints at (${constraint.x}, ${constraint.y}) have no allowed tile IDs in common`
        );
      }
      existingConstraint.allowedTileIds = combinedTileIds;
    }

    const constrainedCells: GridPosition[] = [];
    for (const { position, allowedTileIds } of constraintsByCell.values()) {
      this.updateCellPossibilities(this.grid[position.y][position.x], new Set(allowedTileIds));
      constrainedCells.push(position);
    }

    return constrainedCells;
  }

  /**
   * Calculate the entropy (number of remaining possibilities) for a cell.
   *
   * @param cell - The cell to evaluate.
   * @returns The count of remaining tile possibilities.
   */
  private calculateEntropy(cell: GridCell): number {
    return cell.possibilities.size;
  }

  /**
   * Find the non-collapsed cell with the lowest entropy (fewest possibilities).
   *
   * Returns `null` if all cells are already collapsed.
   *
   * @returns The coordinates of the lowest-entropy cell, or `null` if the grid is fully collapsed.
   */
  private findLowestEntropyCell(): { x: number; y: number } | null {
    let lowestEntropy = Infinity;
    let lowestCell: { x: number; y: number } | null = null;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        if (!cell.collapsed) {
          const entropy = this.calculateEntropy(cell);
          if (entropy < lowestEntropy) {
            lowestEntropy = entropy;
            lowestCell = { x, y };
          }
        }
      }
    }

    return lowestCell;
  }

  /**
   * Order possibilities by weighted random selection without replacement.
   * The order gives backtracking a finite set of choices without retrying a
   * tile that has already caused a contradiction at this decision point.
   *
   * @param possibilities - Array of tile IDs to choose from.
   * @param randomSource - Random source returning values in [0, 1).
   * @returns Tile IDs in weighted trial order.
   */
  private weightedRandomOrder(possibilities: string[], randomSource: () => number): string[] {
    const remaining = [...possibilities];
    const ordered: string[] = [];

    while (remaining.length > 0) {
      const weights = remaining.map((id) => this.tileTypes.get(id)!.weight);
      const maximumWeight = Math.max(...weights);
      const normalizedWeights =
        maximumWeight > 0 ? weights.map((weight) => weight / maximumWeight) : weights.map(() => 1);
      const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
      const randomValue = randomSource();
      if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
        throw new Error('The WFC random source must return a finite number in the range [0, 1)');
      }

      let remainingWeight = randomValue * totalWeight;
      let selectedIndex = normalizedWeights.findIndex((weight) => {
        remainingWeight -= weight;
        return remainingWeight < 0;
      });
      if (selectedIndex < 0) {
        selectedIndex = normalizedWeights.length - 1;
      }
      ordered.push(remaining.splice(selectedIndex, 1)[0]);
    }

    return ordered;
  }

  /**
   * Restore decision snapshots until an untried alternative propagates cleanly.
   *
   * @returns `true` when a new alternative was applied, otherwise `false`.
   */
  private backtrack(): boolean {
    while (this.decisions.length > 0) {
      const decision = this.decisions[this.decisions.length - 1];
      if (decision.nextAlternativeIndex >= decision.alternatives.length) {
        this.decisions.pop();
        continue;
      }
      if (this.backtrackCount >= this.maxBacktracks) {
        return false;
      }

      this.restoreSnapshot(decision.snapshot);
      const alternative = decision.alternatives[decision.nextAlternativeIndex++];
      this.backtrackCount++;
      this.updateCellPossibilities(this.grid[decision.y][decision.x], new Set([alternative]));
      if (this.propagateConstraints([{ x: decision.x, y: decision.y }])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Propagate constraints from the supplied cells until no neighboring domain changes.
   *
   * For each cell, intersect a neighbor's possibilities with the union of tiles
   * allowed by the cell's remaining possibilities. Returns `false` if a
   * contradiction (empty intersection) is detected.
   *
   * @param initialCells - Cells from which propagation starts.
   * @returns `true` if propagation succeeded, `false` if a contradiction was found.
   */
  private propagateConstraints(initialCells: readonly GridPosition[]): boolean {
    const queue = [...initialCells];
    const directions: { dx: number; dy: number; side: NeighborSide }[] = [
      { dx: 0, dy: -1, side: 'top' },
      { dx: 0, dy: 1, side: 'bottom' },
      { dx: -1, dy: 0, side: 'left' },
      { dx: 1, dy: 0, side: 'right' },
    ];

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const cell = this.grid[y][x];

      for (const { dx, dy, side } of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || nx >= this.gridWidth || ny < 0 || ny >= this.gridHeight) {
          continue;
        }

        const allowedTileIds = new Set<string>();
        for (const tileId of cell.possibilities) {
          const tile = this.tileTypes.get(tileId);
          if (!tile) {
            throw new Error(`Grid contains an unknown tile ID: ${tileId}`);
          }
          for (const allowedTileId of tile.constraints[side]) {
            allowedTileIds.add(allowedTileId);
          }
        }

        const neighbor = this.grid[ny][nx];
        const nextPossibilities = new Set(
          [...neighbor.possibilities].filter((tileId) => allowedTileIds.has(tileId))
        );
        if (nextPossibilities.size === 0) {
          return false;
        }
        if (nextPossibilities.size === neighbor.possibilities.size) {
          continue;
        }

        this.updateCellPossibilities(neighbor, nextPossibilities);
        queue.push({ x: nx, y: ny });
      }
    }

    return true;
  }

  /**
   * Set a cell's possibilities and synchronize its collapsed state.
   *
   * @param cell - Cell to update.
   * @param possibilities - Replacement set of possible tile IDs.
   */
  private updateCellPossibilities(cell: GridCell, possibilities: Set<string>): void {
    cell.possibilities = possibilities;
    cell.collapsed = possibilities.size === 1;
    cell.resolvedTileId = cell.collapsed ? possibilities.values().next().value : undefined;
  }

  /**
   * Create an incomplete solution from the current grid state.
   *
   * @returns The partial WFC solution and its backtracking metadata.
   */
  private createIncompleteSolution(): WFCSolution {
    return {
      grid: this.grid.map((row) => row.map((cell) => cell.resolvedTileId ?? '')),
      complete: false,
      backtrackCount: this.backtrackCount,
    };
  }

  /**
   * Take a deep snapshot of the current grid state for backtracking.
   *
   * @returns A {@link GridSnapshot} containing a copy of all cell possibilities.
   */
  private takeSnapshot(): GridSnapshot {
    const cells: Set<string>[][] = [];
    for (let y = 0; y < this.gridHeight; y++) {
      const row: Set<string>[] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        row.push(new Set(this.grid[y][x].possibilities));
      }
      cells.push(row);
    }
    return { cells };
  }

  /**
   * Restore the grid state from a previously taken snapshot.
   *
   * Reconstructs collapse state and resolved tile IDs from restored possibilities.
   *
   * @param snapshot - The snapshot to restore.
   */
  private restoreSnapshot(snapshot: GridSnapshot): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.updateCellPossibilities(this.grid[y][x], new Set(snapshot.cells[y][x]));
      }
    }
  }
}
