import { WFCConfig, TileTypeInternal, TileConstraints, SymmetryMode } from './types';

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

    // Validate symmetry mode
    const validSymmetryModes: SymmetryMode[] = [
      'none',
      'horizontal',
      'vertical',
      'both',
      'rotational',
    ];
    if (config.symmetry && !validSymmetryModes.includes(config.symmetry)) {
      throw new Error(`Invalid symmetry mode: ${config.symmetry}`);
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

    // Validate symmetry requirements
    if (config.symmetry !== 'none') {
      // For horizontal symmetry: if A.right includes B, then B.left must include A
      // For vertical symmetry: if A.bottom includes B, then B.top must include A
      // For rotational: top↔right↔bottom↔left cycle
      for (const tile of config.tiles) {
        if (tile.neighbors) {
          const neighbors = tile.neighbors;
          const tileId = tile.id;

          // Check horizontal symmetry
          if (config.symmetry === 'horizontal' || config.symmetry === 'both') {
            if (neighbors.right) {
              for (const neighborId of neighbors.right) {
                const leftNeighbor = config.tiles.find((t) => t.id === neighborId);
                if (!leftNeighbor || !leftNeighbor.neighbors?.left) {
                  throw new Error(`Horizontal symmetry violation: ${neighborId}.left must exist`);
                }
                if (!leftNeighbor.neighbors.left.includes(tileId)) {
                  throw new Error(
                    `Horizontal symmetry violation: ${neighborId}.left must include ${tileId}`
                  );
                }
              }
            }
          }

          // Check vertical symmetry
          if (config.symmetry === 'vertical' || config.symmetry === 'both') {
            if (neighbors.bottom) {
              for (const neighborId of neighbors.bottom) {
                const topNeighbor = config.tiles.find((t) => t.id === neighborId);
                if (!topNeighbor || !topNeighbor.neighbors?.top) {
                  throw new Error(`Vertical symmetry violation: ${neighborId}.top must exist`);
                }
                if (!topNeighbor.neighbors.top.includes(tileId)) {
                  throw new Error(
                    `Vertical symmetry violation: ${neighborId}.top must include ${tileId}`
                  );
                }
              }
            }
          }

          // Check rotational symmetry
          if (config.symmetry === 'rotational') {
            if (neighbors.top) {
              for (const neighborId of neighbors.top) {
                const rightNeighbor = config.tiles.find((t) => t.id === neighborId);
                if (!rightNeighbor || !rightNeighbor.neighbors?.right) {
                  throw new Error(`Rotational symmetry violation: ${neighborId}.right must exist`);
                }
                if (!rightNeighbor.neighbors.right.includes(tileId)) {
                  throw new Error(
                    `Rotational symmetry violation: ${neighborId}.right must include ${tileId}`
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Convert TileTypeConfig[] to internal Map<string, TileTypeInternal> with symmetry applied
   */
  static buildTileMapping(config: WFCConfig): Map<string, TileTypeInternal> {
    const tileMapping = new Map<string, TileTypeInternal>();

    for (const tileConfig of config.tiles) {
      const tileId = tileConfig.id;
      const weight = tileConfig.weight ?? 1;

      // Build constraints from neighbors
      const constraints: TileConstraints = {
        top: new Set(tileConfig.neighbors?.top ?? []),
        bottom: new Set(tileConfig.neighbors?.bottom ?? []),
        left: new Set(tileConfig.neighbors?.left ?? []),
        right: new Set(tileConfig.neighbors?.right ?? []),
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
