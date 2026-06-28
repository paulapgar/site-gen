import { Actor, Collider, CollisionContact, Engine, Side, vec } from 'excalibur';
import { getResource } from './resources';

/**
 * Actors are the main unit of composition you'll likely use, anything that you want to draw and move around the screen
 * is likely built with an actor
 *
 * They contain a bunch of useful components that you might use:
 * - actor.transform
 * - actor.motion
 * - actor.graphics
 * - actor.body
 * - actor.collider
 * - actor.actions
 * - actor.pointer
 */

/**
 * Represents the player character in the game.
 * Handles player movement, rendering, and collision interactions.
 */
export class Player extends Actor {
  /**
   * Creates a new Player instance.
   * Initializes the player with default position, size, and visual resources.
   */
  constructor() {
    super({
      // Giving your actor a name is optional, but helps in debugging using the dev tools or debug mode
      // https://github.com/excaliburjs/excalibur-extension/
      // Chrome: https://chromewebstore.google.com/detail/excalibur-dev-tools/dinddaeielhddflijbbcmpefamfffekc
      // Firefox: https://addons.mozilla.org/en-US/firefox/addon/excalibur-dev-tools/
      name: 'Player',
      pos: vec(150, 150),
      width: 100,
      height: 100,
      // anchor: vec(0, 0), // Actors default center colliders and graphics with anchor (0.5, 0.5)
      // collisionType: CollisionType.Active, // Collision Type Active means this participates in collisions read more https://excaliburjs.com/docs/collisiontypes
    });
  }

  /**
   * Called when the actor is initialized.
   * This runs before the first update and is useful for:
   * 1. Loading resources like Images for graphics
   * 2. Ensuring Excalibur is initialized & started
   * 3. Deferring logic to runtime instead of constructor time
   * 4. Lazy instantiation
   *
   * @remarks
   * This method is called once per actor instance before the game loop begins.
   */
  override onInitialize(): void {
    // Generally recommended to stick logic in the "On initialize"
    // This runs before the first update
    // Useful when
    // 1. You need things to be loaded like Images for graphics
    // 2. You need excalibur to be initialized & started
    // 3. Deferring logic to run time instead of constructor time
    // 4. Lazy instantiation
    this.graphics.add(getResource('Sword').toSprite());

    // Actions are useful for scripting common behavior, for example patrolling enemies
    this.actions.delay(2000);
    this.actions.repeatForever((ctx) => {
      ctx.moveBy({ offset: vec(100, 0), duration: 1000 });
      ctx.moveBy({ offset: vec(0, 100), duration: 1000 });
      ctx.moveBy({ offset: vec(-100, 0), duration: 1000 });
      ctx.moveBy({ offset: vec(0, -100), duration: 1000 });
    });

    // Sometimes you want to click on an actor!
    this.on('pointerdown', (evt) => {
      // Pointer events tunnel in z order from the screen down, you can cancel them!
      // if (true) {
      //   evt.cancel();
      // }
      console.log('You clicked the actor @', evt.worldPos.toString());
    });
  }

  /**
   * Called before the actor's built-in update logic runs.
   * This method is invoked every frame before the actor's update methods.
   *
   * @param engine - The Excalibur engine instance
   * @param elapsedMs - The time elapsed since the last update in milliseconds
   */
  override onPreUpdate(_engine: Engine, _elapsedMs: number): void {
    // Put any update logic here runs every frame before Actor builtins
  }

  /**
   * Called after the actor's built-in update logic runs.
   * This method is invoked every frame after the actor's update methods.
   *
   * @param engine - The Excalibur engine instance
   * @param elapsedMs - The time elapsed since the last update in milliseconds
   */
  override onPostUpdate(_engine: Engine, _elapsedMs: number): void {
    // Put any update logic here runs every frame after Actor builtins
  }

  /**
   * Called before a collision is resolved.
   * Allows you to opt out of a specific collision by calling `contact.cancel()`.
   *
   * @param self - The collider belonging to this actor
   * @param other - The collider belonging to the other actor
   * @param side - The side of the collision
   * @param contact - The collision contact information
   */
  override onPreCollisionResolve(
    _self: Collider,
    _other: Collider,
    _side: Side,
    _contact: CollisionContact
  ): void {
    // Called before a collision is resolved, if you want to opt out of this specific collision call contact.cancel()
  }

  /**
   * Called every time a collision is resolved and overlap is solved.
   * This is the final step in the collision resolution process.
   *
   * @param self - The collider belonging to this actor
   * @param other - The collider belonging to the other actor
   * @param side - The side of the collision
   * @param contact - The collision contact information
   */
  override onPostCollisionResolve(
    _self: Collider,
    _other: Collider,
    _side: Side,
    _contact: CollisionContact
  ): void {
    // Called every time a collision is resolved and overlap is solved
  }

  /**
   * Called when a pair of objects are in contact.
   * This event fires when two colliders first make contact.
   *
   * @param self - The collider belonging to this actor
   * @param other - The collider belonging to the other actor
   * @param side - The side of the collision
   * @param contact - The collision contact information
   */
  override onCollisionStart(
    _self: Collider,
    _other: Collider,
    _side: Side,
    _contact: CollisionContact
  ): void {
    // Called when a pair of objects are in contact
  }

  /**
   * Called when a pair of objects separate.
   * This event fires when two colliders cease to be in contact.
   *
   * @param self - The collider belonging to this actor
   * @param other - The collider belonging to the other actor
   * @param side - The side of the collision
   * @param lastContact - The last collision contact information before separation
   */
  override onCollisionEnd(
    _self: Collider,
    _other: Collider,
    _side: Side,
    _lastContact: CollisionContact
  ): void {
    // Called when a pair of objects separates
  }
}
