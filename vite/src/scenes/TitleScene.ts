import {
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  type Application,
} from 'pixi.js';
import { Globals } from '../game/Globals';
import { DESIGN_H, DESIGN_W } from '../game/constants';
import { setSound } from '../utils/storage';
import { audioManager } from '../audio/AudioManager';
import { canFullscreen, isFullscreen, toggleFullscreen, needsHomeScreenFullscreen } from '../utils/landscape';
import { makeButton, fitDesignToScreen } from '../ui/ui';
import { formatScore } from '../utils/format';

const SUB_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 22,
  fill: 0xffffff,
  fontWeight: 'bold',
  stroke: { color: 0x000000, width: 4, join: 'round' },
});

const CHECK_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 20,
  fill: 0x1a1a1a,
  fontWeight: 'bold',
  stroke: { color: 0xffffff, width: 4, join: 'round' },
});

export class TitleScene {
  readonly root = new Container();
  private design = new Container();
  private soundMark: Graphics;
  private soundOn = true;

  private constructor(
    private app: Application,
    onPlay: () => void,
    onLeaderboard: () => void
  ) {
    this.root.addChild(this.design);
    this.soundOn = Globals.sound;

    const bg = Sprite.from('/sprites/titleBG.png');
    bg.width = DESIGN_W;
    bg.height = DESIGN_H;
    this.design.addChild(bg);

    const best = new Text({
      text: `Best: ${formatScore(Globals.highScore)}`,
      style: SUB_STYLE,
    });
    best.anchor.set(0.5);
    best.x = DESIGN_W / 2;
    best.y = 900;
    this.design.addChild(best);

    const stool = new Text({
      text: `Golden stool: ${formatScore(Globals.goldenStool)}`,
      style: SUB_STYLE,
    });
    stool.anchor.set(0.5);
    stool.x = DESIGN_W / 2;
    stool.y = 930;
    this.design.addChild(stool);

    const playBtn = makeButton('Play', 280, 72);
    playBtn.x = DESIGN_W / 2;
    playBtn.y = 1280;
    playBtn.on('pointertap', () => {
      audioManager.unlock();
      onPlay();
    });
    this.design.addChild(playBtn);

    const lbBtn = makeButton('Leaderboard', 280, 56, true);
    lbBtn.x = DESIGN_W / 2;
    lbBtn.y = 1380;
    lbBtn.on('pointertap', () => {
      audioManager.unlock();
      onLeaderboard();
    });
    this.design.addChild(lbBtn);

    const soundRow = new Container();
    soundRow.eventMode = 'static';
    soundRow.cursor = 'pointer';
    soundRow.x = DESIGN_W / 2 - 60;
    soundRow.y = 1500;
    const box = new Graphics();
    box.roundRect(0, 0, 28, 28, 4).fill({ color: 0xffffff }).stroke({ color: 0x333333, width: 2 });
    this.soundMark = new Graphics();
    soundRow.addChild(box);
    soundRow.addChild(this.soundMark);
    const soundLabel = new Text({ text: 'Sound', style: CHECK_STYLE });
    soundLabel.x = 40;
    soundLabel.y = 2;
    soundRow.addChild(soundLabel);
    soundRow.on('pointertap', () => {
      this.soundOn = !this.soundOn;
      Globals.sound = this.soundOn;
      setSound(this.soundOn);
      this.drawSoundMark();
      audioManager.unlock();
    });
    this.design.addChild(soundRow);
    this.drawSoundMark();

    if (canFullscreen() || needsHomeScreenFullscreen()) {
      const fsBtn = makeButton(isFullscreen() ? 'Exit Fullscreen' : 'Fullscreen', 280, 48, true);
      fsBtn.x = DESIGN_W / 2;
      fsBtn.y = 1600;
      fsBtn.on('pointertap', () => {
        void toggleFullscreen();
      });
      this.design.addChild(fsBtn);
    }

    const tip = new Text({
      text: 'Tap to lob. Splat dry bugs.\nDon’t let them escape!',
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 18,
        fill: 0xffffff,
        align: 'center',
        stroke: { color: 0x000000, width: 3, join: 'round' },
      }),
    });
    tip.anchor.set(0.5);
    tip.x = DESIGN_W / 2;
    tip.y = 1700;
    this.design.addChild(tip);

    this.layout();
    this.app.renderer.on('resize', this.layout);
  }

  static async create(
    app: Application,
    onPlay: () => void,
    onLeaderboard: () => void
  ): Promise<TitleScene> {
    await Assets.load('/sprites/titleBG.png');
    return new TitleScene(app, onPlay, onLeaderboard);
  }

  private drawSoundMark(): void {
    this.soundMark.clear();
    if (this.soundOn) {
      this.soundMark
        .moveTo(6, 14)
        .lineTo(12, 20)
        .lineTo(22, 8)
        .stroke({ color: 0x1a1a1a, width: 3, cap: 'round', join: 'round' });
    }
  }

  private layout = (): void => {
    const { scale, offsetX, offsetY } = fitDesignToScreen(
      DESIGN_W,
      DESIGN_H,
      this.app.screen.width,
      this.app.screen.height
    );
    this.design.scale.set(scale);
    this.design.x = offsetX;
    this.design.y = offsetY;
  };

  show(): void {
    this.root.visible = true;
  }

  hide(): void {
    this.root.visible = false;
  }

  destroy(): void {
    this.app.renderer.off('resize', this.layout);
    this.root.destroy({ children: true });
  }
}
