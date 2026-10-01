import { WFCConfig, TileTypeInternal, TileConstraints } from './types';

export class ConfigLoader {
  /**
   * Load a WFCConfig from a JSON file path or URL
   */
  static async loadFromPath(pathOrUrl: string): Promise<WFCConfig> {
    const response = await fetch(pathOrUrl);
    if (!response.ok) {
      throw new Error(`Failed to load config from ${pathOrUrl}: ${response.statusText}`);
    }
    const config = await response.json();
    this.validate(config);
    return config;
  }

  /**
   * Validate a config object — throws on invalid data
   */
  static validate(config: WFCConfig): void {
    // Validate grid dimensions
    if (!Number.isInteger(config.gridWidth) || config.gridWidth <= 0) {
      throw new Error('gridWidth must be a positive integer');
    }
    if (!Number.isInteger(config.gridHeight) || config.gridHeight <= 0) {
      throw new Error('gridHeight must be a positive integer');
    }

    // Validate tiles
    if (!Array.isArray(config.tiles) || config.tiles.length === 0) {
      throw new Error('tiles must be a non-empty array');
    }

    const tileIds = new Set<string>();
    const tileNames = new Set<string>();

    for (let i = 0; i < config.tiles.length; i++) {
      const tile = config.tiles[i];

      // Validate tile ID
      if (!tile.id || typeof tile.id !== 'string') {
        throw new Error(`Tile at index ${i} must have a non-empty id string`);
      }
      if (tileIds.has(tile.id)) {
        throw new Error(`Duplicate tile id: ${tile.id}`);
      }
      tileIds.add(tile.id);

      // Validate tile name
      if (!tile.name || typeof tile.name !== 'string') {
        throw new Error(`Tile ${tile.id} must have a non-empty name string`);
      }
      if (tileNames.has(tile.name)) {
        throw new Error(`Duplicate tile name: ${tile.name}`);
      }
      tileNames.add(tile.name);

      // Validate weight
      if (tile.weight !== undefined && (typeof tile.weight !== 'number' || tile.weight < 0)) {
        throw new Error(`Tile ${tile.id} weight must be a non-negative number`);
      }

      // Validate neighbors
      if (tile.neighbors) {
        const neighbors = tile.neighbors as {
          top?: string[];
          bottom?: string[];
          left?: string[];
          right?: string[];
        };
        const neighborKeys = Object.keys(neighbors) as ('top' | 'bottom' | 'left' | 'right')[];
        for (const side of neighborKeys) {
          if (!Array.isArray(neighbors[side])) {
            throw new Error(`Tile ${tile.id} neighbors.${side} must be an array`);
          }
          // Validate neighbor references
          for (const neighborId of neighbors[side]!) {
            if (typeof neighborId !== 'string' || !tileIds.has(neighborId)) {
              throw new Error(`Tile ${tile.id} references invalid neighbor id: ${neighborId}`);
            }
          }
        }
      }
    }
  }

  /**
   * Convert TileTypeConfig[] to an internal map with directional neighbor constraints.
   */
  static buildTileMapping(config: WFCConfig): Map<string, TileTypeInternal> {
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
