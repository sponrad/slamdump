import { Sprite, Texture } from 'pixi.js';
import {
  BUG_DEFS,
  WORM_OFFSPRING_DELAY,
  type BugKind,
  type Ellipse,
} from './constants';
import { pointInEllipse } from './WaterBounds';
import { Globals } from './Globals';
import { audioManager } from '../audio/AudioManager';

export type BugCallbacks = {
  onEscaped: () => void;
  spawnOffspring: (x: number, y: number) => void;
};

export class Bug {
  readonly kind: BugKind;
  readonly sprite: Sprite;
  alive = true;
  inWater = true;
  private speed: number;
  private dying = false;
  private dieTimer = 0;
  private spawnKids = false;
  private readonly def: (typeof BUG_DEFS)[BugKind];
  private readonly playArea: Ellipse;
  private readonly water: Ellipse;
  private readonly cbs: BugCallbacks;
  private readonly vx: number;
  private readonly vy: number;

  constructor(
    kind: BugKind,
    x: number,
    y: number,
    water: Ellipse,
    playArea: Ellipse,
    cbs: BugCallbacks,
    forceDry = false
  ) {
    this.kind = kind;
    this.def = BUG_DEFS[kind];
    this.water = water;
    this.playArea = playArea;
    this.cbs = cbs;
    this.inWater = forceDry ? false : pointInEllipse(x, y, water);

    this.sprite = new Sprite(Texture.from(this.def.sprite));
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(this.def.displayScale);
    this.sprite.eventMode = 'none';
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.rotation = Math.random() * Math.PI * 2;
    this.speed = this.def.minSpeed + Math.random() * (this.def.speed - this.def.minSpeed);

    const angle = this.sprite.rotation;
    if (this.def.moveAxis === 'up') {
      this.vx = Math.sin(angle) * this.speed;
      this.vy = -Math.cos(angle) * this.speed;
    } else {
      this.vx = -Math.cos(angle) * this.speed;
      this.vy = -Math.sin(angle) * this.speed;
    }
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }
  get hitRadius(): number {
    return this.def.hitRadius;
  }

  update(dt: number): void {
    if (!this.alive) return;

    if (this.dying) {
      this.dieTimer -= dt;
      if (this.dieTimer <= 0) {
        if (this.spawnKids) {
          this.cbs.spawnOffspring(this.x, this.y);
        }
        this.destroy();
      }
      return;
    }

    this.sprite.x += this.vx * dt;
    this.sprite.y += this.vy * dt;

    this.inWater = pointInEllipse(this.x, this.y, this.water);

    if (!pointInEllipse(this.x, this.y, this.playArea)) {
      this.alive = false;
      this.cbs.onEscaped();
    }
  }

  tryHit(): boolean {
    if (!this.alive || this.dying || this.inWater) return false;

    audioManager.playSplat();

    this.showSplat();

    if (this.def.isGolden) {
      Globals.goldenStool += 1;
      this.dying = true;
      this.dieTimer = 0.4;
      return true;
    }

    Globals.score += 1;

    if (this.def.isBigWorm) {
      this.dying = true;
      this.spawnKids = true;
      this.dieTimer = WORM_OFFSPRING_DELAY;
    } else {
      Globals.tempGameBugsKilled += 1;
      this.dying = true;
      this.dieTimer = 0.35;
    }
    return true;
  }

  private showSplat(): void {
    const splat = this.def.splatSprite;
    if (!splat) {
      this.sprite.visible = false;
      return;
    }
    const liveW = this.sprite.texture.width * Math.abs(this.sprite.scale.x);
    this.sprite.texture = Texture.from(splat);
    const splatW = this.sprite.texture.width || 1;
    this.sprite.scale.set(liveW / splatW);
    this.sprite.visible = true;
  }

  destroy(): void {
    this.alive = false;
    this.sprite.destroy();
  }
}
