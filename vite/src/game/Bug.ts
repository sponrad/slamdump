import { Assets, Container, Sprite } from 'pixi.js';
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
  readonly container: Container;
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

  private constructor(
    kind: BugKind,
    texture: Awaited<ReturnType<typeof Assets.load>>,
    x: number,
    y: number,
    water: Ellipse,
    playArea: Ellipse,
    cbs: BugCallbacks,
    forceDry: boolean
  ) {
    this.kind = kind;
    this.def = BUG_DEFS[kind];
    this.water = water;
    this.playArea = playArea;
    this.cbs = cbs;
    this.inWater = forceDry ? false : pointInEllipse(x, y, water);

    this.container = new Container();
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(this.def.displayScale);
    this.container.addChild(this.sprite);
    this.container.x = x;
    this.container.y = y;

    this.container.rotation = Math.random() * Math.PI * 2;
    this.speed = this.def.minSpeed + Math.random() * (this.def.speed - this.def.minSpeed);
  }

  static async create(
    kind: BugKind,
    x: number,
    y: number,
    water: Ellipse,
    playArea: Ellipse,
    cbs: BugCallbacks,
    forceDry = false
  ): Promise<Bug> {
    const texture = await Assets.load(BUG_DEFS[kind].sprite);
    return new Bug(kind, texture, x, y, water, playArea, cbs, forceDry);
  }

  get x(): number {
    return this.container.x;
  }
  get y(): number {
    return this.container.y;
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

    const angle = this.container.rotation;
    if (this.def.moveAxis === 'up') {
      this.container.x += Math.sin(angle) * this.speed * dt;
      this.container.y -= Math.cos(angle) * this.speed * dt;
    } else {
      // Unity: -= transform.right → move along -local X
      this.container.x -= Math.cos(angle) * this.speed * dt;
      this.container.y -= Math.sin(angle) * this.speed * dt;
    }

    this.inWater = pointInEllipse(this.x, this.y, this.water);

    if (!pointInEllipse(this.x, this.y, this.playArea)) {
      this.alive = false;
      this.cbs.onEscaped();
    }
  }

  /** Returns true if this bug was splatted. */
  tryHit(): boolean {
    if (!this.alive || this.dying || this.inWater) return false;

    audioManager.playSplat();

    if (this.def.isGolden) {
      Globals.goldenStool += 1;
      this.speed = 0;
      this.dying = true;
      this.dieTimer = 0.4;
      return true;
    }

    Globals.score += 1;

    if (this.def.isBigWorm) {
      this.sprite.visible = false;
      this.speed = 0;
      this.dying = true;
      this.spawnKids = true;
      this.dieTimer = WORM_OFFSPRING_DELAY;
    } else {
      Globals.tempGameBugsKilled += 1;
      this.sprite.visible = false;
      this.speed = 0;
      this.dying = true;
      this.dieTimer = 0.35;
    }
    return true;
  }

  destroy(): void {
    this.alive = false;
    this.container.destroy({ children: true });
  }
}
