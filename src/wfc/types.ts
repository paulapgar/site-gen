// --- Enums ---
export type SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'both' | 'rotational';
export type NeighborSide = 'top' | 'bottom' | 'left' | 'right';

// --- Config interfaces (from JSON) ---
export interface WFCConfig {
  /** Width of the output grid in cells */
  gridWidth: number;
  /** Height of the output grid in cells */
  gridHeight: number;
  /** Symmetry mode applied to neighbor constraints. Default "none". */
  symmetry?: SymmetryMode;
  /** Array of tile type definitions with their neighbor constraints */
  tiles: TileTypeConfig[];
}

export interface TileTypeConfig {
  /** Unique identifier for this tile (used in neighbor references) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Reference to a sprite/image asset path or Excalibur resource key.
   * Used by the integration layer to map collapsed tiles to visuals. */
  spriteRef?: string;
  /** Optional weight for probabilistic selection during collapse. Higher = more likely. Default 1. */
  weight?: number;
  /** Neighbor constraints: which tile IDs are allowed adjacent on each side.
   * If omitted, the tile can be adjacent to ANY other tile (fully permissive). */
  neighbors?: {
    top?: string[];
    bottom?: string[];
    left?: string[];
    right?: string[];
  };
}

// --- Internal engine types ---
/** A single cell in the WFC grid. Holds a set of possible tile IDs. */
export interface GridCell {
  /** Possible tile IDs remaining for this cell (superposition state) */
  possibilities: Set<string>;
  /** Whether this cell has been collapsed to a single tile */
  collapsed: boolean;
  /** The resolved tile ID after collapse */
  resolvedTileId?: string;
}

/** Neighbor constraint map: for each side, which tile IDs are allowed. */
export interface TileConstraints {
  top: Set<string>;
  bottom: Set<string>;
  left: Set<string>;
  right: Set<string>;
}

/** Internal representation of a tile type with resolved constraints. */
export interface TileTypeInternal {
  id: string;
  name: string;
  spriteRef?: string;
  weight: number;
  constraints: TileConstraints;
}

/** Result of running the WFC algorithm. */
export interface WFCSolution {
  /** The completed grid as a 2D array of tile IDs */
  grid: string[][];
  /** Whether the solution was fully solved (no contradictions) */
  complete: boolean;
  /** Number of backtracking steps performed */
  backtrackCount: number;
}

/** A snapshot of the grid state for backtracking. */
export interface GridSnapshot {
  cells: Set<string>[][]; // array of arrays of tile ID strings (for fast deep copy)
}
