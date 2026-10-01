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

  /** Stack of grid snapshots used for backtracking. */
  private snapshots: GridSnapshot[] = [];

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
    this.snapshots = [];

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
        return {
          grid: this.grid.map((row) => row.map((cell) => cell.resolvedTileId!)),
          complete: true,
          backtrackCount: this.backtrackCount,
        };
      }

      const { x, y } = targetCell;

      // Collapse the cell
      const success = this.collapseCell(x, y) && this.propagateConstraints([{ x, y }]);

      if (!success) {
        // Contradiction detected - try backtracking
        if (this.snapshots.length === 0 || this.backtrackCount >= this.maxBacktracks) {
          // No backtracking path or retry budget remains
          return this.createIncompleteSolution();
        }

        // Restore previous snapshot
        this.restoreSnapshot(this.snapshots.pop()!);
        this.backtrackCount++;
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
   * Collapse a cell to a single tile via weighted random selection.
   *
   * A snapshot is taken before collapse to enable backtracking.
   *
   * @param x - Column index of the cell.
   * @param y - Row index of the cell.
   * @returns `true` if collapse succeeded, `false` if no valid tiles remain.
   */
  private collapseCell(x: number, y: number): boolean {
    const cell = this.grid[y][x];
    const possibilities = Array.from(cell.possibilities);

    if (possibilities.length === 0) {
      return false; // No valid tiles
    }

    // Take snapshot before collapse for backtracking
    this.snapshots.push(this.takeSnapshot());

    // Weighted random selection
    const selectedTile = this.weightedRandomSelect(possibilities);

    // Update cell
    this.updateCellPossibilities(cell, new Set([selectedTile]));

    return true;
  }

  /**
   * Select a tile from the given possibilities using weighted random selection.
   *
   * @param possibilities - Array of tile IDs to choose from.
   * @returns The selected tile ID.
   */
  private weightedRandomSelect(possibilities: string[]): string {
    // Calculate cumulative weights
    const weights = possibilities.map((id) => this.tileTypes.get(id)!.weight);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let random = Math.random() * totalWeight;
    for (let i = 0; i < possibilities.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return possibilities[i];
      }
    }

    return possibilities[possibilities.length - 1];
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
