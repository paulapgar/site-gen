import {
  DefaultLoader,
  Engine,
  ExcaliburGraphicsContext,
  Scene,
  SceneActivationContext,
  Sprite,
  TileMap,
  Vector,
} from 'excalibur';
import { loadSpriteSheet, SpriteSheetConfig } from './util/sprites';
import {
  ConfigLoader,
  generateGrassPerimeterConstraints,
  WaveFunctionCollapse,
} from './wfc/wfc-model';
import { generateCastleLayoutConstraints } from './wfc/seeded-floor-constraints';

/**
 * Defines the primary playable scene for the game.
 *
 * The scene creates a centered tile map from the configured WFC output.
 */
export class MyLevel extends Scene {
  /**
   * Builds the centered tile map and adds it after WFC config and sprites load.
   *
   * @param engine - The Excalibur engine that owns this scene.
   */
  override onInitialize(engine: Engine): void {
    const tileSize = 32;
    const spriteConfigPath = './configs/spritemap.json';
    const wfcConfigPath = './configs/castle-tiles.json';

    void Promise.all([
      loadSpriteSheet(spriteConfigPath),
      fetch(spriteConfigPath).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load sprite-sheet config: ${response.statusText}`);
        }
        return response.json() as Promise<SpriteSheetConfig>;
      }),
      ConfigLoader.loadFromPath(wfcConfigPath),
    ])
      .then(([tileImages, spriteConfig, config]) => {
        const cellConstraints = [
          ...generateGrassPerimeterConstraints(config.gridWidth, config.gridHeight),
          ...generateCastleLayoutConstraints(config.gridWidth, config.gridHeight),
        ];
        const solution = new WaveFunctionCollapse(config).solve({ cellConstraints });
        if (!solution.complete) {
          throw new Error(
            `WFC could not complete the configured grid after ${solution.backtrackCount} backtracks`
          );
        }

        const columns = config.gridWidth;
        const rows = config.gridHeight;
        if (solution.grid.length !== rows || solution.grid.some((row) => row.length !== columns)) {
          throw new Error('WFC solution dimensions do not match the configured grid');
        }

        const firstSpriteName = spriteConfig.tiles[0]?.name;
        const atlasImage = firstSpriteName ? tileImages[firstSpriteName] : undefined;
        if (!atlasImage) {
          throw new Error('Sprite-sheet config does not provide a usable atlas image');
        }
        const spriteConfigsByName = new Map(
          spriteConfig.tiles.map((spriteConfig) => [spriteConfig.name, spriteConfig])
        );
        const sourceTileWidth = atlasImage.image.width / spriteConfig.gridWidth;
        const sourceTileHeight = atlasImage.image.height / spriteConfig.gridHeight;

        const tileSprites = new Map<string, Sprite>();
        for (const tileConfig of config.tiles) {
          const spriteRef = tileConfig.spriteRef ?? tileConfig.id;
          const spriteConfigTile = spriteConfigsByName.get(spriteRef);
          if (!spriteConfigTile) {
            throw new Error(
              `WFC tile ${tileConfig.id} references missing sprite-sheet tile: ${spriteRef}`
            );
          }
          tileSprites.set(
            tileConfig.id,
            Sprite.from(atlasImage, {
              sourceView: {
                x: spriteConfigTile.col * sourceTileWidth,
                y: spriteConfigTile.row * sourceTileHeight,
                width: sourceTileWidth,
                height: sourceTileHeight,
              },
              destSize: { width: tileSize, height: tileSize },
            })
          );
        }

        const tileMap = new TileMap({
          columns,
          rows,
          tileWidth: tileSize,
          tileHeight: tileSize,
          pos: new Vector(
            (engine.screen.width - columns * tileSize) / 2,
            (engine.screen.height - rows * tileSize) / 2
          ),
        });

        let tileIndex = 0;
        for (const row of solution.grid) {
          for (const tileId of row) {
            const sprite = tileSprites.get(tileId);
            const tile = tileMap.tiles[tileIndex++];
            if (!sprite || !tile) {
              throw new Error(`WFC solution references an unknown tile ID: ${tileId}`);
            }
            tile.addGraphic(sprite);
          }
        }

        this.add(tileMap);
      })
      .catch((error: unknown) => {
        console.error('Failed to create level tile map:', error);
      });
  }

  /**
   * Registers resources required exclusively by this level.
   *
   * @param _loader - The loader used to load scene resources.
   */
  override onPreLoad(_loader: DefaultLoader): void {
    // Add any scene specific resources to load
  }

  /**
   * Handles activation when this level becomes the current scene.
   *
   * @param _context - Context describing the scene activation.
   */
  override onActivate(_context: SceneActivationContext<unknown>): void {
    // Called when Excalibur transitions to this scene
    // Only 1 scene is active at a time
  }

  /**
   * Handles deactivation when another scene replaces this level.
   *
   * @param _context - Context describing the scene deactivation.
   */
  override onDeactivate(_context: SceneActivationContext): void {
    // Called when Excalibur transitions away from this scene
    // Only 1 scene is active at a time
  }

  /**
   * Runs immediately before Excalibur updates the scene each frame.
   *
   * @param _engine - The Excalibur engine that is updating the scene.
   * @param _elapsedMs - Milliseconds elapsed since the previous frame.
   */
  override onPreUpdate(_engine: Engine, _elapsedMs: number): void {
    // Called before anything updates in the scene
  }

  /**
   * Runs immediately after Excalibur updates the scene each frame.
   *
   * @param _engine - The Excalibur engine that updated the scene.
   * @param _elapsedMs - Milliseconds elapsed since the previous frame.
   */
  override onPostUpdate(_engine: Engine, _elapsedMs: number): void {
    // Called after everything updates in the scene
  }

  /**
   * Runs immediately before Excalibur renders the scene each frame.
   *
   * @param _ctx - The graphics context used to render the scene.
   * @param _elapsedMs - Milliseconds elapsed since the previous frame.
   */
  override onPreDraw(_ctx: ExcaliburGraphicsContext, _elapsedMs: number): void {
    // Called before Excalibur draws to the screen
  }

  /**
   * Runs immediately after Excalibur finishes rendering the scene each frame.
   *
   * @param _ctx - The graphics context used to render the scene.
   * @param _elapsedMs - Milliseconds elapsed since the previous frame.
   */
  override onPostDraw(_ctx: ExcaliburGraphicsContext, _elapsedMs: number): void {
    // Called after Excalibur draws to the screen
  }
}
