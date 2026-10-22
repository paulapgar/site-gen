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

/**
 * Defines the primary playable scene for the game.
 *
 * The scene creates a centered tile map and fills each tile with a randomly
 * selected sprite-sheet tile during initialization. The remaining lifecycle
 * hooks are available for level-specific behavior as the game evolves.
 */
export class MyLevel extends Scene {
  /**
   * Builds the centered tile map and adds it after its sprite-sheet tiles load.
   *
   * @param engine - The Excalibur engine that owns this scene.
   */
  override onInitialize(engine: Engine): void {
    const tileSize = 32;
    const columns = 20;
    const rows = 15;
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

    const configPath = './configs/spritemap.json';
    void Promise.all([
      loadSpriteSheet(configPath),
      fetch(configPath).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load sprite-sheet config: ${response.statusText}`);
        }
        return response.json() as Promise<SpriteSheetConfig>;
      }),
    ])
      .then(([tileImages, config]) => {
        const sheetImage = tileImages[config.tiles[0].name];
        const sourceTileWidth = sheetImage.image.width / config.gridWidth;
        const sourceTileHeight = sheetImage.image.height / config.gridHeight;
        const sprites = config.tiles.map(({ name, row, col }) =>
          Sprite.from(tileImages[name], {
            sourceView: {
              x: col * sourceTileWidth,
              y: row * sourceTileHeight,
              width: sourceTileWidth,
              height: sourceTileHeight,
            },
            destSize: { width: tileSize, height: tileSize },
          })
        );

        for (const tile of tileMap.tiles) {
          const sprite = sprites[Math.floor(Math.random() * sprites.length)];
          tile.addGraphic(sprite);
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
