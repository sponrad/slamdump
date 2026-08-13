import {
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  type Application,
  type FederatedPointerEvent,
} from 'pixi.js';
import { Globals } from '../game/Globals';
import {
  DESIGN_H,
  DESIGN_W,
  FIRST_SPAWN_DELAY,
  LEVELS,
  POO_SPAWN_X_PAD,
  POO_SPAWN_Y,
  type BugKind,
  type Ellipse,
  type LevelId,
} from '../game/constants';
import { randomPointInEllipse } from '../game/WaterBounds';
import { Bug } from '../game/Bug';
import { Poo, type PooLandEvent } from '../game/Poo';
import { Ripple } from '../game/Ripple';
import { Shake } from '../game/Shake';
import { audioManager } from '../audio/AudioManager';
import { fitDesignToScreen } from '../ui/ui';
import { formatScore } from '../utils/format';

const HUD_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 42,
  fill: 0xffffff,
  fontWeight: 'bold',
  stroke: { color: 0x000000, width: 5, join: 'round' },
});

const DEBUG_LABEL_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 22,
  fill: 0xffffff,
  fontWeight: 'bold',
  stroke: { color: 0x000000, width: 4, join: 'round' },
});

export class PlayScene {
  readonly root = new Container();
  private design = new Container();
  private world = new Container();
  private rippleLayer = new Container();
  private fxLayer = new Container();
  private hudLayer = new Container();
  private debugLayer = new Container();
  private debugGfx = new Graphics();
  private debugWaterLabel = new Text({ text: 'WATER (no hit)', style: DEBUG_LABEL_STYLE });
  private debugEscapeLabel = new Text({ text: 'ESCAPE ZONE', style: DEBUG_LABEL_STYLE });

  private bugs: Bug[] = [];
  private poos: Poo[] = [];
  private ripple = new Ripple();
  private shake = new Shake();
  private wasShaking = false;
  private lastHudScore = -1;
  private lastHudGolden = -1;

  private scoreText!: Text;
  private goldenText!: Text;
  private gameRunning = false;
  private spawnTimer = 0;
  private tickerFn: ((ticker: { deltaMS: number }) => void) | null = null;
  private level = LEVELS.gasStation;
  private debugZonesEnabled = false;

  private constructor(
    private app: Application,
    private onGameOver: () => void
  ) {
    this.root.eventMode = 'none';
    this.design.eventMode = 'none';
    this.world.eventMode = 'none';
    this.rippleLayer.eventMode = 'none';
    this.fxLayer.eventMode = 'none';
    this.root.addChild(this.design);
    this.design.addChild(this.world);
    this.world.addChild(this.rippleLayer);
    this.world.addChild(this.fxLayer);
    this.rippleLayer.addChild(this.ripple.sprite);
    this.design.addChild(this.hudLayer);

    this.debugLayer.eventMode = 'none';
    this.debugLayer.visible = false;
    this.debugLayer.addChild(this.debugGfx);
    this.debugWaterLabel.anchor.set(0.5);
    this.debugWaterLabel.style = DEBUG_LABEL_STYLE.clone();
    this.debugWaterLabel.style.fill = 0x33ccff;
    this.debugEscapeLabel.anchor.set(0.5);
    this.debugEscapeLabel.style = DEBUG_LABEL_STYLE.clone();
    this.debugEscapeLabel.style.fill = 0xff3b30;
    this.debugLayer.addChild(this.debugWaterLabel);
    this.debugLayer.addChild(this.debugEscapeLabel);

    this.scoreText = new Text({ text: '0', style: HUD_STYLE });
    this.scoreText.x = 40;
    this.scoreText.y = 40;
    this.hudLayer.addChild(this.scoreText);

    this.goldenText = new Text({ text: '★ 0', style: HUD_STYLE });
    this.goldenText.anchor.set(1, 0);
    this.goldenText.x = DESIGN_W - 40;
    this.goldenText.y = 40;
    this.hudLayer.addChild(this.goldenText);
    this.hudLayer.eventMode = 'none';

    if (import.meta.env.DEV) {
      window.addEventListener('keydown', this.onDebugToggleKeyDown);
    }

    this.layout();
    this.app.renderer.on('resize', this.layout);
  }

  static async create(app: Application, onGameOver: () => void): Promise<PlayScene> {
    await Assets.load([
      '/sprites/BGgasstation.png',
      '/sprites/BGportapotty.png',
      '/sprites/orangeroach.png',
      '/sprites/orangeRoachSplat.png',
      '/sprites/greenpincher.png',
      '/sprites/greenpincherSplat.png',
      '/sprites/gondelroach.png',
      '/sprites/worm1.png',
      '/sprites/worm11.png',
      '/sprites/worm2.png',
      '/sprites/worm21.png',
      '/sprites/poop1.png',
      '/sprites/poop2.png',
      '/sprites/poop3.png',
      '/sprites/ripple.png',
      '/sprites/watershade.png',
    ]);
    return new PlayScene(app, onGameOver);
  }

  async startLevel(id: LevelId): Promise<void> {
    this.stopTicker();
    this.clearEntities();
    this.restoreDebugToWorld();
    this.world.removeChildren();
    this.fxLayer.removeChildren();

    this.level = LEVELS[id];
    this.gameRunning = true;
    Globals.inGame = true;
    this.lastHudScore = -1;
    this.lastHudGolden = -1;
    this.wasShaking = false;

    const bg = Sprite.from(this.level.bg);
    bg.width = DESIGN_W;
    bg.height = DESIGN_H;
    bg.eventMode = 'none';
    this.world.addChild(bg);

    if (!Globals.lowPowerMode) {
      const shade = Sprite.from('/sprites/watershade.png');
      shade.anchor.set(0.5);
      shade.x = this.level.water.cx;
      shade.y = this.level.water.cy;
      shade.width = this.level.water.rx * 2;
      shade.height = this.level.water.ry * 2;
      shade.alpha = 0.4;
      shade.eventMode = 'none';
      this.world.addChild(shade);
    }

    if (!this.rippleLayer.parent) this.world.addChild(this.rippleLayer);
    if (!this.fxLayer.parent) this.world.addChild(this.fxLayer);
    this.ripple.place(this.level.water.cx, this.level.water.cy);
    this.world.addChild(this.debugLayer);
    this.drawZoneDebug();

    this.spawnTimer = FIRST_SPAWN_DELAY;
    for (let i = 0; i < this.level.introBugs; i++) {
      this.spawnEnemy(false);
    }

    this.updateHud();
    document.body.classList.add('gameplay-active');
    this.bindInput();

    this.tickerFn = (ticker) => {
      const dt = Math.min(0.05, ticker.deltaMS / 1000);
      this.update(dt);
    };
    this.app.ticker.add(this.tickerFn);
  }

  private bindInput(): void {
    this.unbindInput();
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', this.onPointerDown);
  }

  private unbindInput(): void {
    this.app.stage.off('pointerdown', this.onPointerDown);
  }

  /** Convert canvas/stage coords → design/world space (accounts for letterbox + shake). */
  private screenToWorld(globalX: number, globalY: number): { x: number; y: number } {
    const scale = this.design.scale.x || this.layoutBase.scale || 1;
    return {
      x: (globalX - this.design.x) / scale,
      y: (globalY - this.design.y) / scale,
    };
  }

  private onPointerDown = (e: FederatedPointerEvent): void => {
    if (!this.gameRunning || !this.root.visible) return;
    // Ignore UI scenes stacked above us (shouldn't happen while playing).
    audioManager.unlock();
    audioManager.beginFrame();

    const { x, y } = this.screenToWorld(e.global.x, e.global.y);
    if (x < 0 || y < 0 || x > DESIGN_W || y > DESIGN_H) return;

    const spawnX = POO_SPAWN_X_PAD + Math.random() * (DESIGN_W - POO_SPAWN_X_PAD * 2);
    const poo = new Poo(spawnX, POO_SPAWN_Y, x, y, this.level.water, (ev) =>
      this.handlePooLand(ev)
    );
    this.poos.push(poo);
    this.fxLayer.addChild(poo.sprite);
  };

  private onDebugToggleKeyDown = (e: KeyboardEvent): void => {
    if (!import.meta.env.DEV) return;
    if (e.key !== '0') return;
    this.debugZonesEnabled = !this.debugZonesEnabled;
    this.drawZoneDebug();
    if (this.debugZonesEnabled && !this.gameRunning && this.root.visible) {
      this.bringDebugToFront();
    } else if (!this.debugZonesEnabled) {
      this.restoreDebugToWorld();
    }
  };

  private drawZoneDebug(): void {
    this.debugGfx.clear();
    if (!this.debugZonesEnabled) {
      this.debugLayer.visible = false;
      return;
    }
    this.debugLayer.visible = true;

    const water = this.level.water;
    const play = this.level.playArea;

    // Escape / play area — leave this = game over
    this.strokeEllipse(play, 0xff3b30, 0xff3b30, 0.12);
    // Water — invulnerable while inside
    this.strokeEllipse(water, 0x33ccff, 0x33ccff, 0.22);

    this.debugEscapeLabel.x = play.cx;
    this.debugEscapeLabel.y = play.cy - play.ry - 28;

    this.debugWaterLabel.x = water.cx;
    this.debugWaterLabel.y = water.cy;

    // Keep debug on top of bugs/poo
    if (this.debugLayer.parent) {
      this.debugLayer.parent.addChild(this.debugLayer);
    }
  }

  private strokeEllipse(
    e: Ellipse,
    stroke: number,
    fill: number,
    fillAlpha: number
  ): void {
    this.debugGfx.ellipse(e.cx, e.cy, e.rx, e.ry);
    this.debugGfx.fill({ color: fill, alpha: fillAlpha });
    this.debugGfx.ellipse(e.cx, e.cy, e.rx, e.ry);
    this.debugGfx.stroke({ color: stroke, width: 4, alpha: 0.95 });
  }

  private handlePooLand(ev: PooLandEvent): void {
    this.shake.trigger();
    this.ripple.replay();

    let hitSomeone = false;
    const hitR = ev.hitRadius;
    const ex = ev.x;
    const ey = ev.y;
    for (let i = 0; i < this.bugs.length; i++) {
      const bug = this.bugs[i]!;
      if (!bug.alive) continue;
      const dx = bug.x - ex;
      const dy = bug.y - ey;
      const r = hitR + bug.hitRadius;
      if (dx * dx + dy * dy <= r * r && bug.tryHit()) {
        hitSomeone = true;
      }
    }
    if (hitSomeone) this.updateHud();
    else audioManager.playSplat();
  }

  private spawnEnemy(allowGolden: boolean): void {
    let kind: BugKind;
    if (allowGolden && Math.random() < this.level.rewardBugChance) {
      kind = 'golden';
    } else {
      const pool = this.level.enemyKinds;
      kind = pool[Math.floor(Math.random() * pool.length)]!;
    }
    const pos = randomPointInEllipse(this.level.water);
    const bug = new Bug(
      kind,
      pos.x,
      pos.y,
      this.level.water,
      this.level.playArea,
      this.bugCbs
    );
    this.bugs.push(bug);
    this.fxLayer.addChild(bug.sprite);
  }

  private spawnOffspring(x: number, y: number): void {
    for (let i = 0; i < 2; i++) {
      const bug = new Bug(
        'wormSmall',
        x + (i === 0 ? -20 : 20),
        y + (Math.random() * 20 - 10),
        this.level.water,
        this.level.playArea,
        this.bugCbsNoKids,
        true
      );
      this.bugs.push(bug);
      this.fxLayer.addChild(bug.sprite);
    }
  }

  private readonly bugCbs = {
    onEscaped: () => this.triggerGameOver(),
    spawnOffspring: (x: number, y: number) => this.spawnOffspring(x, y),
  };

  private readonly bugCbsNoKids = {
    onEscaped: () => this.triggerGameOver(),
    spawnOffspring: () => undefined,
  };

  private update(dt: number): void {
    if (!this.gameRunning) return;
    audioManager.beginFrame();

    const shaking = this.shake.active || this.wasShaking;
    if (shaking) {
      const offset = this.shake.update(dt);
      this.design.x = this.layoutBase.offsetX + offset.x * this.layoutBase.scale;
      this.design.y = this.layoutBase.offsetY + offset.y * this.layoutBase.scale;
      this.wasShaking = this.shake.active;
    }

    let dead = false;
    for (let i = 0; i < this.bugs.length; i++) {
      const b = this.bugs[i]!;
      b.update(dt);
      if (!b.alive) dead = true;
    }
    for (let i = 0; i < this.poos.length; i++) {
      const p = this.poos[i]!;
      p.update(dt);
      if (!p.alive) dead = true;
    }
    this.ripple.update(dt);

    if (dead) {
      compactAlive(this.bugs);
      compactAlive(this.poos);
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.random() * this.level.delayModifier;
      const score = Globals.score;
      const spawnCountFactor = Math.ceil(
        0.05 * score * Math.sin(0.4 * Math.pow(Math.max(score, 0), 0.85))
      );
      this.spawnEnemy(true);
      for (let i = 0; i < spawnCountFactor; i++) {
        this.spawnEnemy(false);
      }
    }

    this.updateHud();
  }

  private updateHud(): void {
    if (this.lastHudScore !== Globals.score) {
      this.lastHudScore = Globals.score;
      this.scoreText.text = formatScore(Globals.score);
    }
    if (this.lastHudGolden !== Globals.goldenStool) {
      this.lastHudGolden = Globals.goldenStool;
      this.goldenText.text = `★ ${formatScore(Globals.goldenStool)}`;
    }
  }

  private triggerGameOver(): void {
    if (!this.gameRunning) return;
    this.gameRunning = false;
    Globals.inGame = false;
    document.body.classList.remove('gameplay-active');
    this.unbindInput();
    this.stopTicker();
    this.bringDebugToFront();
    this.onGameOver();
  }

  /** Keep the last frame visible under Game Over, including zone overlays. */
  freeze(): void {
    document.body.classList.remove('gameplay-active');
    this.unbindInput();
    this.stopTicker();
    this.gameRunning = false;
    this.root.visible = true;
    this.bringDebugToFront();
  }

  /** Put zone overlay back in the world (under menus). */
  lowerDebugOverlay(): void {
    this.restoreDebugToWorld();
  }

  private bringDebugToFront(): void {
    if (!this.debugZonesEnabled) return;
    this.drawZoneDebug();
    this.debugLayer.scale.copyFrom(this.design.scale);
    this.debugLayer.position.set(this.design.x, this.design.y);
    this.app.stage.addChild(this.debugLayer);
  }

  private restoreDebugToWorld(): void {
    this.debugLayer.scale.set(1);
    this.debugLayer.position.set(0, 0);
    this.world.addChild(this.debugLayer);
    this.drawZoneDebug();
  }

  private stopTicker(): void {
    if (this.tickerFn) {
      this.app.ticker.remove(this.tickerFn);
      this.tickerFn = null;
    }
  }

  private clearEntities(): void {
    for (const b of this.bugs) b.destroy();
    for (const p of this.poos) p.destroy();
    this.bugs = [];
    this.poos = [];
    this.ripple.sprite.visible = false;
    this.ripple.alive = false;
  }

  private layoutBase = { scale: 1, offsetX: 0, offsetY: 0 };

  private layout = (): void => {
    const fit = fitDesignToScreen(
      DESIGN_W,
      DESIGN_H,
      this.app.screen.width,
      this.app.screen.height
    );
    this.layoutBase = fit;
    this.design.scale.set(fit.scale);
    this.design.x = fit.offsetX;
    this.design.y = fit.offsetY;
    this.shake.setBase(0, 0);
    if (this.debugLayer.parent === this.app.stage) {
      this.debugLayer.scale.copyFrom(this.design.scale);
      this.debugLayer.position.set(this.design.x, this.design.y);
    }
  };

  show(): void {
    this.root.visible = true;
  }

  hide(): void {
    this.root.visible = false;
    document.body.classList.remove('gameplay-active');
    this.unbindInput();
    this.restoreDebugToWorld();
  }

  destroy(): void {
    if (import.meta.env.DEV) {
      window.removeEventListener('keydown', this.onDebugToggleKeyDown);
    }
    this.unbindInput();
    this.stopTicker();
    this.clearEntities();
    this.app.renderer.off('resize', this.layout);
    this.root.destroy({ children: true });
  }
}

function compactAlive<T extends { alive: boolean }>(list: T[]): void {
  let write = 0;
  for (let i = 0; i < list.length; i++) {
    const item = list[i]!;
    if (item.alive) list[write++] = item;
  }
  list.length = write;
}
