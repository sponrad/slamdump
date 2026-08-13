import { Sprite, Texture } from 'pixi.js';
import { RIPPLE_LIFE, RIPPLE_START_SCALE } from './constants';

/**
 * Port of RippleScript.cs — fade + slight shrink each frame.
 * One instance is reused (all landings share the water-center ripple).
 */
export class Ripple {
  readonly sprite: Sprite;
  alive = false;
  private life = 0;
  private alpha = 1;
  private scale = RIPPLE_START_SCALE;

  constructor() {
    this.sprite = new Sprite(Texture.from('/sprites/ripple.png'));
    this.sprite.anchor.set(0.5);
    this.sprite.eventMode = 'none';
    this.sprite.visible = false;
  }

  place(x: number, y: number): void {
    this.sprite.x = x;
    this.sprite.y = y;
  }

  replay(): void {
    this.alive = true;
    this.life = RIPPLE_LIFE;
    this.alpha = 1;
    this.scale = RIPPLE_START_SCALE;
    this.sprite.alpha = 1;
    this.sprite.scale.set(this.scale);
    this.sprite.visible = true;
  }

  update(dt: number): void {
    if (!this.alive) return;
    const frames = dt * 60;
    this.life -= dt;
    this.alpha -= 0.05 * frames;
    this.scale -= 0.01 * frames;
    this.sprite.alpha = Math.max(0, this.alpha);
    this.sprite.scale.set(Math.max(0.01, this.scale));
    if (this.life <= 0 || this.alpha <= 0) {
      this.alive = false;
      this.sprite.visible = false;
    }
  }

  destroy(): void {
    this.alive = false;
    this.sprite.destroy();
  }
}
