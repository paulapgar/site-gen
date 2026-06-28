import {
  WFCConfig,
  GridCell,
  TileTypeInternal,
  WFCSolution,
  GridSnapshot,
  NeighborSide,
  SymmetryMode,
} from './types';
import { ConfigLoader } from './config-loader';

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
 * const solution = wfc.solve();
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

  /** Symmetry mode applied during observation. */
  private symmetryMode: SymmetryMode;

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
    this.symmetryMode = config.symmetry ?? 'none';
    this.tileTypes = ConfigLoader.buildTileMapping(config);
    this.grid = this.initializeGrid();
  }

  /**
   * Run the full WFC algorithm until completion, contradiction, or max iterations.
   *
   * @returns A {@link WFCSolution} containing the resolved grid and metadata.
   */
  solve(): WFCSolution {
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
      const success = this.collapseCell(x, y);

      if (!success) {
        // Contradiction detected - try backtracking
        if (this.snapshots.length === 0) {
          // No backtracking path - return incomplete solution
          return {
            grid: this.grid.map((row) => row.map((cell) => cell.resolvedTileId ?? '')),
            complete: false,
            backtrackCount: this.backtrackCount,
          };
        }

        // Restore previous snapshot
        this.restoreSnapshot(this.snapshots.pop()!);
        this.backtrackCount++;
      } else {
        // Propagate constraints to neighbors
        this.propagateConstraints(x, y);
      }
    }

    // Max iterations reached
    return {
      grid: this.grid.map((row) => row.map((cell) => cell.resolvedTileId ?? '')),
      complete: false,
      backtrackCount: this.backtrackCount,
    };
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
    cell.possibilities.clear();
    cell.possibilities.add(selectedTile);
    cell.collapsed = true;
    cell.resolvedTileId = selectedTile;

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
   * Propagate constraints from a collapsed cell to all adjacent neighbors.
   *
   * For each neighbor, intersect its possibilities with the allowed tiles
   * defined by the placed tile's constraints. Returns `false` if a contradiction
   * (empty intersection) is detected.
   *
   * @param x - Column index of the collapsed cell.
   * @param y - Row index of the collapsed cell.
   * @returns `true` if propagation succeeded, `false` if a contradiction was found.
   */
  private propagateConstraints(x: number, y: number): boolean {
    const cell = this.grid[y][x];
    const resolvedTileId = cell.resolvedTileId!;

    // Check all four directions
    const directions: { dx: number; dy: number; side: NeighborSide }[] = [
      { dx: 0, dy: -1, side: 'top' },
      { dx: 0, dy: 1, side: 'bottom' },
      { dx: -1, dy: 0, side: 'left' },
      { dx: 1, dy: 0, side: 'right' },
    ];

    for (const { dx, dy, side } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      // Check bounds
      if (nx < 0 || nx >= this.gridWidth || ny < 0 || ny >= this.gridHeight) {
        continue;
      }

      const neighbor = this.grid[ny][nx];

      if (neighbor.collapsed) {
        continue;
      }

      // Get the tile type that was just placed
      const placedTile = this.tileTypes.get(resolvedTileId)!;

      // Determine which side of the neighbor faces the placed tile
      const facingSide = this.getFacingSide(side, dx, dy);

      // Get allowed tiles for that side
      const allowedTiles = placedTile.constraints[facingSide];

      // Intersect with neighbor's possibilities
      neighbor.possibilities = new Set(
        Array.from(neighbor.possibilities).filter((id) => allowedTiles.has(id))
      );

      // If intersection is empty, contradiction
      if (neighbor.possibilities.size === 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Determine which side of a neighbor faces the placed tile.
   *
   * Given the relative direction `(dx, dy)` from the placed tile to the neighbor,
   * returns the neighbor side that faces the placed tile.
   *
   * @param side - The side of the placed tile where the neighbor resides.
   * @param dx - Horizontal offset to the neighbor.
   * @param dy - Vertical offset to the neighbor.
   * @returns The neighbor side facing the placed tile.
   */
  private getFacingSide(side: NeighborSide, dx: number, dy: number): NeighborSide {
    // If placed tile is above (dy = -1), then neighbor's bottom faces it
    if (dy === -1) return 'bottom';
    // If placed tile is below (dy = 1), then neighbor's top faces it
    if (dy === 1) return 'top';
    // If placed tile is left (dx = -1), then neighbor's right faces it
    if (dx === -1) return 'right';
    // If placed tile is right (dx = 1), then neighbor's left faces it
    if (dx === 1) return 'left';
    return side;
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
   * Resets collapse state and resolved tile IDs for all cells.
   *
   * @param snapshot - The snapshot to restore.
   */
  private restoreSnapshot(snapshot: GridSnapshot): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x].possibilities = new Set(snapshot.cells[y][x]);
        this.grid[y][x].collapsed = false;
        this.grid[y][x].resolvedTileId = undefined;
      }
    }
  }
}
