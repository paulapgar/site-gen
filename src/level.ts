import {
  DefaultLoader,
  Engine,
  ExcaliburGraphicsContext,
  Scene,
  SceneActivationContext,
} from 'excalibur';

/**
 * Custom scene for the game level.
 *
 * Extends the Excalibur {@link Scene} to provide lifecycle hooks
 * for initialization, resource loading, updates, and rendering.
 *
 * @example
 * ```ts
 * const level = new MyLevel();
 * engine.currentScene = level;
 * ```
 */
export class MyLevel extends Scene {
  /**
   * Called once when the scene is first initialized.
   * Perform composition and add actors to the scene here.
   *
   * @param engine - The Excalibur engine instance.
   */
  override onInitialize(_engine: Engine): void {
    // Scene.onInitialize is where we recommend you perform the composition for your game
    //const player = new Player();
    //this.add(player); // Actors need to be added to a scene to be drawn
  }

  /**
   * Called before resources are loaded for this scene.
   * Add scene-specific assets to the loader here.
   *
   * @param loader - The default resource loader.
   */
  override onPreLoad(_loader: DefaultLoader): void {
    // Add any scene specific resources to load
  }

  /**
   * Called when Excalibur transitions to this scene.
   * Only one scene is active at a time.
   *
   * @param context - Context information about the scene activation.
   */
  override onActivate(_context: SceneActivationContext<unknown>): void {
    // Called when Excalibur transitions to this scene
    // Only 1 scene is active at a time
  }

  /**
   * Called when Excalibur transitions away from this scene.
   * Only one scene is active at a time.
   *
   * @param context - Context information about the scene deactivation.
   */
  override onDeactivate(_context: SceneActivationContext): void {
    // Called when Excalibur transitions away from this scene
    // Only 1 scene is active at a time
  }

  /**
   * Called before anything updates in the scene.
   *
   * @param engine - The Excalibur engine instance.
   * @param elapsedMs - Time elapsed since the last frame in milliseconds.
   */
  override onPreUpdate(_engine: Engine, _elapsedMs: number): void {
    // Called before anything updates in the scene
  }

  /**
   * Called after everything updates in the scene.
   *
   * @param engine - The Excalibur engine instance.
   * @param elapsedMs - Time elapsed since the last frame in milliseconds.
   */
  override onPostUpdate(_engine: Engine, _elapsedMs: number): void {
    // Called after everything updates in the scene
  }

  /**
   * Called before Excalibur draws to the screen.
   *
   * @param ctx - The graphics rendering context.
   * @param elapsedMs - Time elapsed since the last frame in milliseconds.
   */
  override onPreDraw(_ctx: ExcaliburGraphicsContext, _elapsedMs: number): void {
    // Called before Excalibur draws to the screen
  }

  /**
   * Called after Excalibur draws to the screen.
   *
   * @param ctx - The graphics rendering context.
   * @param elapsedMs - Time elapsed since the last frame in milliseconds.
   */
  override onPostDraw(_ctx: ExcaliburGraphicsContext, _elapsedMs: number): void {
    // Called after Excalibur draws to the screen
  }
}
