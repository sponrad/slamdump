import { Assets, Container, Sprite } from 'pixi.js';
import {
  POO_DISPLAY_SCALE,
  POO_HIT_RADIUS,
  POO_LIFE,
  POO_ROTATION_RANGE,
  POO_SPEED,
  POO_SPRITES,
  type Ellipse,
} from './constants';
import { pointInEllipse } from './WaterBounds';
import { Globals } from './Globals';
import { audioManager } from '../audio/AudioManager';

export type PooLandEvent = {
  x: number;
  y: number;
  inWater: boolean;
  hitRadius: number;
  setSplatTexture: (url: string) => Promise<void>;
};

export class Poo {
  readonly container: Container;
  readonly sprite: Sprite;
  alive = true;
  private targetX: number;
  private targetY: number;
  private landed = false;
  private life = POO_LIFE;
  private rotSpeed: number;
  private water: Ellipse;
  private onLand: (e: PooLandEvent) => void;

  private constructor(
    texture: Awaited<ReturnType<typeof Assets.load>>,
    x: number,
    y: number,
    tx: number,
    ty: number,
    water: Ellipse,
    onLand: (e: PooLandEvent) => void
  ) {
    this.water = water;
    this.onLand = onLand;
    this.targetX = tx;
    this.targetY = ty;

    this.container = new Container();
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(POO_DISPLAY_SCALE);
    this.container.addChild(this.sprite);
    this.container.x = x;
    this.container.y = y;

    this.rotSpeed = (Math.random() - 0.5) * POO_ROTATION_RANGE;

    Globals.tempShotsFired += 1;
    audioManager.playPooSpawn();
  }

  static async create(
    x: number,
    y: number,
    tx: number,
    ty: number,
    water: Ellipse,
    onLand: (e: PooLandEvent) => void
  ): Promise<Poo> {
    const url = POO_SPRITES[Math.floor(Math.random() * POO_SPRITES.length)]!;
    const texture = await Assets.load(url);
    return new Poo(texture, x, y, tx, ty, water, onLand);
  }

  get x(): number {
    return this.container.x;
  }
  get y(): number {
    return this.container.y;
  }

  update(dt: number): void {
    if (!this.alive) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.destroy();
      return;
    }

    if (this.landed) return;

    this.container.rotation += this.rotSpeed * dt;

    const dx = this.targetX - this.container.x;
    const dy = this.targetY - this.container.y;
    const dist = Math.hypot(dx, dy);
    const step = POO_SPEED * dt;

    if (dist <= step || dist < 0.5) {
      this.container.x = this.targetX;
      this.container.y = this.targetY;
      this.landed = true;
      const inWater = pointInEllipse(this.x, this.y, this.water);
      this.onLand({
        x: this.x,
        y: this.y,
        inWater,
        hitRadius: POO_HIT_RADIUS,
        setSplatTexture: async (url: string) => {
          const tex = await Assets.load(url);
          this.sprite.texture = tex;
        },
      });
      return;
    }

    this.container.x += (dx / dist) * step;
    this.container.y += (dy / dist) * step;
  }

  destroy(): void {
    this.alive = false;
    this.container.destroy({ children: true });
  }
}
