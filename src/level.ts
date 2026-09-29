import {
  DefaultLoader,
  Engine,
  ExcaliburGraphicsContext,
  Rectangle,
  Scene,
  SceneActivationContext,
  TileMap,
  Vector,
} from 'excalibur';
import { Resources } from './resources';
import { colorSquares } from './util/sprites';

/**
 * Defines the primary playable scene for the game.
 *
 * The scene creates a centered tile map and fills each tile with a randomly
 * selected color resource during initialization. The remaining lifecycle
 * hooks are available for level-specific behavior as the game evolves.
 */
export class MyLevel extends Scene {
  /**
   * Builds and adds the level's tile map before the scene begins updating.
   *
   * @param engine - The Excalibur engine that owns this scene.
   */
  override onInitialize(engine: Engine): void {
    const tileSize = 8;
    const mapSize = 20;
    const tileMap = new TileMap({
      columns: mapSize,
      rows: mapSize,
      tileWidth: tileSize,
      tileHeight: tileSize,
      pos: new Vector(
        (engine.screen.width - mapSize * tileSize) / 2,
        (engine.screen.height - mapSize * tileSize) / 2
      ),
    });
    const colors = colorSquares
      .map(({ name }) => Resources[name])
      .filter((resource): resource is Rectangle => resource instanceof Rectangle);

    for (const tile of tileMap.tiles) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      tile.addGraphic(color);
    }

    this.add(tileMap);
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
