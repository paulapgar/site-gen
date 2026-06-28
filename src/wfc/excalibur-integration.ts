import { SpriteSheet, ImageSource, Sprite } from 'excalibur';
import { WFCSolution } from './types';

export class WFCTileMapAdapter {
  /**
   * Convert a WFCSolution grid into an array of sprites.
   * This helper creates sprites for each tile in the solution, which can then be used
   * to build a TileMap or display directly.
   * @param solution - The WFC result
   * @param tileSpriteSheet - A pre-loaded Excalibur SpriteSheet containing all tile sprites,
   *                         indexed by the order they appear in the config's tiles array
   * @returns Array of sprites corresponding to the solution grid
   */
  static spritesFromSolution(solution: WFCSolution, tileSpriteSheet: SpriteSheet): Sprite[] {
    const sprites: Sprite[] = [];

    // Map tile IDs to sprite indices
    const tileIdToSpriteIndex = new Map<string, number>();
    for (let i = 0; i < solution.grid.length; i++) {
      for (let j = 0; j < solution.grid[i].length; j++) {
        const tileId = solution.grid[i][j];
        if (tileId && !tileIdToSpriteIndex.has(tileId)) {
          tileIdToSpriteIndex.set(tileId, tileIdToSpriteIndex.size);
        }
      }
    }

    // Create sprites for each tile in the solution
    for (let y = 0; y < solution.grid.length; y++) {
      for (let x = 0; x < solution.grid[y].length; x++) {
        const tileId = solution.grid[y][x];
        if (tileId) {
          const spriteIndex = tileIdToSpriteIndex.get(tileId)!;
          const sprite = tileSpriteSheet.sprites[spriteIndex];
          sprites.push(sprite);
        }
      }
    }

    return sprites;
  }

  /**
   * Build a SpriteSheet from an array of sprite references (image paths or resource keys).
   * Helper for the integration layer.
   * Note: This is a simplified version. For production use, you may need to adjust
   * the Excalibur API calls based on your specific version.
   */
  static async buildTileSpriteSheet(
    spriteRefs: string[],
    tileWidth: number,
    tileHeight: number
  ): Promise<SpriteSheet> {
    const imageSources = await Promise.all(
      spriteRefs.map((ref) => {
        if (ref.startsWith('sprites/')) {
          // Load from public directory
          return new ImageSource(ref);
        } else {
          // Assume it's an Excalibur resource key
          return new ImageSource(ref);
        }
      })
    );

    // Create sprites from images
    const sprites = imageSources.map((img) => {
      const sprite = Sprite.from(img);
      sprite.width = tileWidth;
      sprite.height = tileHeight;
      return sprite;
    });

    return new SpriteSheet({
      sprites,
    });
  }
}
