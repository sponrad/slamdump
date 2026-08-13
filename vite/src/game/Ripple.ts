import { Assets, Container, Sprite } from 'pixi.js';
import { RIPPLE_LIFE, RIPPLE_START_SCALE } from './constants';

/**
 * Port of RippleScript.cs — fade + slight shrink each frame.
 * Unity Instantiated the prefab on poo land (any surface).
 */
export class Ripple {
  readonly container: Container;
  private sprite: Sprite;
  private life = RIPPLE_LIFE;
  private alpha = 1;
  private scale: number;
  alive = true;

  private constructor(texture: Awaited<ReturnType<typeof Assets.load>>, x: number, y: number) {
    this.container = new Container();
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.scale = RIPPLE_START_SCALE;
    this.sprite.scale.set(this.scale);
    this.container.addChild(this.sprite);
    this.container.x = x;
    this.container.y = y;
    this.container.eventMode = 'none';
  }

  static async create(x: number, y: number): Promise<Ripple> {
    const texture = await Assets.load('/sprites/ripple.png');
    return new Ripple(texture, x, y);
  }

  update(dt: number): void {
    if (!this.alive) return;
    const frames = dt * 60;
    this.life -= dt;
    // Unity: alpha -= 0.05; scale -= 0.01 per Update
    this.alpha -= 0.05 * frames;
    this.scale -= 0.01 * frames;
    this.sprite.alpha = Math.max(0, this.alpha);
    this.sprite.scale.set(Math.max(0.01, this.scale));
    if (this.life <= 0 || this.alpha <= 0) {
      this.destroy();
    }
  }

  destroy(): void {
    this.alive = false;
    this.container.destroy({ children: true });
  }
}
