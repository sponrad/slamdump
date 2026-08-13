import { Sprite, Texture } from 'pixi.js';
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
};

export class Poo {
  readonly sprite: Sprite;
  alive = true;
  private targetX: number;
  private targetY: number;
  private landed = false;
  private life = POO_LIFE;
  private rotSpeed: number;
  private water: Ellipse;
  private onLand: (e: PooLandEvent) => void;

  constructor(
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

    const url = POO_SPRITES[Math.floor(Math.random() * POO_SPRITES.length)]!;
    this.sprite = new Sprite(Texture.from(url));
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(POO_DISPLAY_SCALE);
    this.sprite.eventMode = 'none';
    this.sprite.x = x;
    this.sprite.y = y;

    this.rotSpeed = (Math.random() - 0.5) * POO_ROTATION_RANGE;

    Globals.tempShotsFired += 1;
    audioManager.playPooSpawn();
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }

  update(dt: number): void {
    if (!this.alive) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.destroy();
      return;
    }

    if (this.landed) return;

    this.sprite.rotation += this.rotSpeed * dt;

    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    const step = POO_SPEED * dt;

    if (dist <= step || dist < 0.5) {
      this.sprite.x = this.targetX;
      this.sprite.y = this.targetY;
      this.landed = true;
      const inWater = pointInEllipse(this.x, this.y, this.water);
      this.onLand({
        x: this.x,
        y: this.y,
        inWater,
        hitRadius: POO_HIT_RADIUS,
      });
      return;
    }

    this.sprite.x += (dx / dist) * step;
    this.sprite.y += (dy / dist) * step;
  }

  destroy(): void {
    this.alive = false;
    this.sprite.destroy();
  }
}
