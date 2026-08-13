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
  BUG_DEFS,
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
  private fxLayer = new Container();
  private hudLayer = new Container();
  private debugLayer = new Container();
  private debugGfx = new Graphics();
  private debugWaterLabel = new Text({ text: 'WATER (no hit)', style: DEBUG_LABEL_STYLE });
  private debugEscapeLabel = new Text({ text: 'ESCAPE ZONE', style: DEBUG_LABEL_STYLE });

  private bugs: Bug[] = [];
  private poos: Poo[] = [];
  private ripples: Ripple[] = [];
  private shake = new Shake();

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
    this.root.addChild(this.design);
    this.design.addChild(this.world);
    this.world.addChild(this.fxLayer);
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
      '/sprites/worm2.png',
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

    const bg = Sprite.from(this.level.bg);
    bg.width = DESIGN_W;
    bg.height = DESIGN_H;
    this.world.addChild(bg);

    // Water shade overlay — sized to match water ellipse
    try {
      const shade = Sprite.from('/sprites/watershade.png');
      shade.anchor.set(0.5);
      shade.x = this.level.water.cx;
      shade.y = this.level.water.cy;
      shade.width = this.level.water.rx * 2;
      shade.height = this.level.water.ry * 2;
      shade.alpha = 0.4;
      this.world.addChild(shade);
    } catch {
      /* optional */
    }

    if (!this.fxLayer.parent) this.world.addChild(this.fxLayer);
    this.world.addChild(this.debugLayer);
    this.drawZoneDebug();

    this.spawnTimer = FIRST_SPAWN_DELAY;
    for (let i = 0; i < this.level.introBugs; i++) {
      await this.spawnEnemy(false);
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
    void Poo.create(spawnX, POO_SPAWN_Y, x, y, this.level.water, (ev) =>
      this.handlePooLand(ev)
    ).then((poo) => {
      if (!this.gameRunning) {
        poo.destroy();
        return;
      }
      this.poos.push(poo);
      this.fxLayer.addChild(poo.container);
    });
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
    void Ripple.create(ev.x, ev.y).then((r) => {
      if (!r.alive) return;
      this.ripples.push(r);
      this.fxLayer.addChild(r.container);
    });

    let hitSomeone = false;
    for (const bug of this.bugs) {
      if (!bug.alive) continue;
      const d = Math.hypot(bug.x - ev.x, bug.y - ev.y);
      if (d <= ev.hitRadius + bug.hitRadius && bug.tryHit()) {
        hitSomeone = true;
        const splat = BUG_DEFS[bug.kind].splatSprite;
        if (splat) void ev.setSplatTexture(splat);
      }
    }
    if (hitSomeone) this.updateHud();
  }

  private async spawnEnemy(allowGolden: boolean): Promise<void> {
    let kind: BugKind;
    if (allowGolden && Math.random() < this.level.rewardBugChance) {
      kind = 'golden';
    } else {
      const pool = this.level.enemyKinds;
      kind = pool[Math.floor(Math.random() * pool.length)]!;
    }
    const pos = randomPointInEllipse(this.level.water);
    const bug = await Bug.create(kind, pos.x, pos.y, this.level.water, this.level.playArea, {
      onEscaped: () => this.triggerGameOver(),
      spawnOffspring: (x, y) => {
        void this.spawnOffspring(x, y);
      },
    });
    if (!this.gameRunning) {
      bug.destroy();
      return;
    }
    this.bugs.push(bug);
    this.fxLayer.addChild(bug.container);
  }

  private async spawnOffspring(x: number, y: number): Promise<void> {
    for (let i = 0; i < 2; i++) {
      const bug = await Bug.create(
        'wormSmall',
        x + (i === 0 ? -20 : 20),
        y + (Math.random() * 20 - 10),
        this.level.water,
        this.level.playArea,
        {
          onEscaped: () => this.triggerGameOver(),
          spawnOffspring: () => undefined,
        },
        true
      );
      if (!this.gameRunning) {
        bug.destroy();
        return;
      }
      this.bugs.push(bug);
      this.fxLayer.addChild(bug.container);
    }
  }

  private update(dt: number): void {
    if (!this.gameRunning) return;
    audioManager.beginFrame();

    const offset = this.shake.update(dt);
    // shake applied relative to layout base — store base in layout
    this.design.x = this.layoutBase.offsetX + offset.x * this.layoutBase.scale;
    this.design.y = this.layoutBase.offsetY + offset.y * this.layoutBase.scale;

    for (const bug of this.bugs) bug.update(dt);
    for (const poo of this.poos) poo.update(dt);
    for (const r of this.ripples) r.update(dt);

    this.bugs = this.bugs.filter((b) => b.alive && b.container.parent);
    this.poos = this.poos.filter((p) => p.alive && p.container.parent);
    this.ripples = this.ripples.filter((r) => r.alive && r.container.parent);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.random() * this.level.delayModifier;
      // Unity: spawnCountFactor = ceil(0.05 * score * sin(0.4 * score^0.85))
      const score = Globals.score;
      const spawnCountFactor = Math.ceil(
        0.05 * score * Math.sin(0.4 * Math.pow(Math.max(score, 0), 0.85))
      );
      void this.spawnEnemy(true);
      for (let i = 0; i < spawnCountFactor; i++) {
        void this.spawnEnemy(false);
      }
    }

    this.updateHud();
  }

  private updateHud(): void {
    this.scoreText.text = formatScore(Globals.score);
    this.goldenText.text = `★ ${formatScore(Globals.goldenStool)}`;
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
    for (const r of this.ripples) r.destroy();
    this.bugs = [];
    this.poos = [];
    this.ripples = [];
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
