import {
  DefaultLoader,
  Engine,
  ExcaliburGraphicsContext,
  Scene,
  SceneActivationContext,
} from 'excalibur';

/**
 * The primary game scene.
 *
 * Provides lifecycle hooks for composing the level, loading its resources,
 * and responding to scene activation, updates, and drawing.
 */
export class MyLevel extends Scene {
  /**
   * Initializes the level before its first update frame.
   *
   * @param _engine - The Excalibur engine instance
   */
  override onInitialize(_engine: Engine): void {
    // Scene.onInitialize is where we recommend you perform the composition for your game
    //const player = new Player();
    //this.add(player); // Actors need to be added to a scene to be drawn
  }

  /**
   * Registers resources that are specific to this level.
   *
   * @param _loader - The loader used to load level resources
   */
  override onPreLoad(_loader: DefaultLoader): void {
    // Add any scene specific resources to load
  }

  /**
   * Runs when the level becomes the active scene.
   *
   * @param _context - Context describing the scene activation
   */
  override onActivate(_context: SceneActivationContext<unknown>): void {
    // Called when Excalibur transitions to this scene
    // Only 1 scene is active at a time
  }

  /**
   * Runs when the level is no longer the active scene.
   *
   * @param _context - Context describing the scene deactivation
   */
  override onDeactivate(_context: SceneActivationContext): void {
    // Called when Excalibur transitions away from this scene
    // Only 1 scene is active at a time
  }

  /**
   * Runs every frame before built-in scene update logic.
   *
   * @param _engine - The Excalibur engine instance
   * @param _elapsedMs - Time elapsed since the last frame in milliseconds
   */
  override onPreUpdate(_engine: Engine, _elapsedMs: number): void {
    // Called before anything updates in the scene
  }

  /**
   * Runs every frame after built-in scene update logic.
   *
   * @param _engine - The Excalibur engine instance
   * @param _elapsedMs - Time elapsed since the last frame in milliseconds
   */
  override onPostUpdate(_engine: Engine, _elapsedMs: number): void {
    // Called after everything updates in the scene
  }

  /**
   * Runs every frame before Excalibur draws the scene.
   *
   * @param _ctx - The graphics context used to draw the scene
   * @param _elapsedMs - Time elapsed since the last frame in milliseconds
   */
  override onPreDraw(_ctx: ExcaliburGraphicsContext, _elapsedMs: number): void {
    // Called before Excalibur draws to the screen
  }

  /**
   * Runs every frame after Excalibur finishes drawing the scene.
   *
   * @param _ctx - The graphics context used to draw the scene
   * @param _elapsedMs - Time elapsed since the last frame in milliseconds
   */
  override onPostDraw(_ctx: ExcaliburGraphicsContext, _elapsedMs: number): void {
    // Called after Excalibur draws to the screen
  }
}
