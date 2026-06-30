import { Actor, Collider, CollisionContact, Engine, Side, vec } from 'excalibur';
import { getResource } from './resources';

/**
 * The player-controlled actor in the game.
 *
 * Renders a sword sprite and performs a looping patrol animation.
 * Responds to pointer (click) events by logging the click position.
 */
export class Player extends Actor {
  /**
   * Creates a new `Player` instance positioned at `(150, 150)` with a size of `100×100`.
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
   * Initializes the player actor before the first update frame.
   *
   * Adds the sword sprite to the graphics layer and sets up a looping patrol action:
   * move right → down → left → up, with a 2-second initial delay.
   * Also listens for pointer-down events on the actor.
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
   * Runs every frame before built-in `Actor` update logic.
   *
   * @param _engine - The Excalibur engine instance
   * @param _elapsedMs - Time elapsed since the last frame in milliseconds
   */
  override onPreUpdate(_engine: Engine, _elapsedMs: number): void {
    // Put any update logic here runs every frame before Actor builtins
  }

  /**
   * Runs every frame after built-in `Actor` update logic.
   *
   * @param _engine - The Excalibur engine instance
   * @param _elapsedMs - Time elapsed since the last frame in milliseconds
   */
  override onPostUpdate(_engine: Engine, _elapsedMs: number): void {
    // Put any update logic here runs every frame after Actor builtins
  }

  /**
   * Called before a collision is resolved between this actor and another collider.
   *
   * @param _self - The collider of this actor
   * @param _other - The collider of the other actor involved in the collision
   * @param _side - The side of contact on this actor's collider
   * @param _contact - The collision contact information
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
   *
   * @param _self - The collider of this actor
   * @param _other - The collider of the other actor involved in the collision
   * @param _side - The side of contact on this actor's collider
   * @param _contact - The collision contact information
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
   * Called when this actor first comes into contact with another collider.
   *
   * @param _self - The collider of this actor
   * @param _other - The collider of the other actor involved in the collision
   * @param _side - The side of contact on this actor's collider
   * @param _contact - The collision contact information
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
   * Called when this actor separates from another collider.
   *
   * @param _self - The collider of this actor
   * @param _other - The collider of the other actor involved in the collision
   * @param _side - The side of contact on this actor's collider
   * @param _lastContact - The last known collision contact information
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
