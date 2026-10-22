import { WFCConfig, TileTypeInternal, TileConstraints, NeighborSide } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class ConfigLoader {
  /**
   * Load a WFCConfig from a JSON file path or URL
   */
  static async loadFromPath(pathOrUrl: string): Promise<WFCConfig> {
    const response = await fetch(pathOrUrl);
    if (!response.ok) {
      throw new Error(`Failed to load config from ${pathOrUrl}: ${response.statusText}`);
    }
    const config: unknown = await response.json();
    this.validate(config);
    return config;
  }

  /**
   * Validate a config object — throws on invalid data
   */
  static validate(config: unknown): asserts config is WFCConfig {
    if (!isRecord(config)) {
      throw new Error('WFC config must be an object');
    }

    // Validate grid dimensions
    if (!Number.isInteger(config.gridWidth) || (config.gridWidth as number) <= 0) {
      throw new Error('gridWidth must be a positive integer');
    }
    if (!Number.isInteger(config.gridHeight) || (config.gridHeight as number) <= 0) {
      throw new Error('gridHeight must be a positive integer');
    }

    // Validate tiles
    if (!Array.isArray(config.tiles) || config.tiles.length === 0) {
      throw new Error('tiles must be a non-empty array');
    }

    const tileIds = new Set<string>();
    const tileNames = new Set<string>();
    const neighborReferences: { tileId: string; neighborId: string; side: string }[] = [];
    const validSides: readonly NeighborSide[] = ['top', 'bottom', 'left', 'right'];

    for (let i = 0; i < config.tiles.length; i++) {
      const tileValue: unknown = config.tiles[i];
      if (!isRecord(tileValue)) {
        throw new Error(`Tile at index ${i} must be an object`);
      }
      const tile = tileValue;

      // Validate tile ID
      if (typeof tile.id !== 'string' || tile.id.trim().length === 0) {
        throw new Error(`Tile at index ${i} must have a non-empty id string`);
      }
      if (tileIds.has(tile.id)) {
        throw new Error(`Duplicate tile id: ${tile.id}`);
      }
      tileIds.add(tile.id);

      // Validate tile name
      if (typeof tile.name !== 'string' || tile.name.trim().length === 0) {
        throw new Error(`Tile ${tile.id} must have a non-empty name string`);
      }
      if (tileNames.has(tile.name)) {
        throw new Error(`Duplicate tile name: ${tile.name}`);
      }
      tileNames.add(tile.name);

      if (
        tile.spriteRef !== undefined &&
        (typeof tile.spriteRef !== 'string' || tile.spriteRef.trim().length === 0)
      ) {
        throw new Error(`Tile ${tile.id} spriteRef must be a non-empty string when provided`);
      }

      // Validate weight
      if (
        tile.weight !== undefined &&
        (typeof tile.weight !== 'number' || !Number.isFinite(tile.weight) || tile.weight < 0)
      ) {
        throw new Error(`Tile ${tile.id} weight must be a finite non-negative number`);
      }

      // Validate neighbors
      if (tile.neighbors !== undefined) {
        if (!isRecord(tile.neighbors)) {
          throw new Error(`Tile ${tile.id} neighbors must be an object`);
        }
        for (const [side, neighborIds] of Object.entries(tile.neighbors)) {
          if (!validSides.includes(side as NeighborSide)) {
            throw new Error(`Tile ${tile.id} has invalid neighbor direction: ${side}`);
          }
          if (!Array.isArray(neighborIds)) {
            throw new Error(`Tile ${tile.id} neighbors.${side} must be an array`);
          }
          for (const neighborId of neighborIds) {
            if (typeof neighborId !== 'string' || neighborId.trim().length === 0) {
              throw new Error(`Tile ${tile.id} neighbors.${side} must contain tile ID strings`);
            }
            neighborReferences.push({ tileId: tile.id, neighborId, side });
          }
        }
      }
    }

    // Resolve references only after all IDs have been collected, so forward
    // references in the tile list are valid.
    for (const { tileId, neighborId, side } of neighborReferences) {
      if (!tileIds.has(neighborId)) {
        throw new Error(
          `Tile ${tileId} neighbors.${side} references unknown tile ID: ${neighborId}`
        );
      }
    }
  }

  /**
   * Convert TileTypeConfig[] to an internal map with directional neighbor constraints.
   */
  static buildTileMapping(config: WFCConfig): Map<string, TileTypeInternal> {
    this.validate(config);
    const tileMapping = new Map<string, TileTypeInternal>();
    const allTileIds = config.tiles.map((tile) => tile.id);

    for (const tileConfig of config.tiles) {
      const tileId = tileConfig.id;
      const weight = tileConfig.weight ?? 1;

      // Build constraints from neighbors
      const constraints: TileConstraints = {
        top: new Set(tileConfig.neighbors?.top ?? allTileIds),
        bottom: new Set(tileConfig.neighbors?.bottom ?? allTileIds),
        left: new Set(tileConfig.neighbors?.left ?? allTileIds),
        right: new Set(tileConfig.neighbors?.right ?? allTileIds),
      };

      tileMapping.set(tileId, {
        id: tileId,
        name: tileConfig.name,
        spriteRef: tileConfig.spriteRef,
        weight,
        constraints,
      });
    }

    return tileMapping;
  }
}
