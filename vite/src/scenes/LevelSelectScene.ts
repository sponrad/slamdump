import {
  Assets,
  Container,
  Sprite,
  Text,
  TextStyle,
  type Application,
} from 'pixi.js';
import { Globals } from '../game/Globals';
import { DESIGN_H, DESIGN_W, LEVELS, type LevelId } from '../game/constants';
import { audioManager } from '../audio/AudioManager';
import { makeButton, fitDesignToScreen } from '../ui/ui';

const TITLE_STYLE = new TextStyle({
  fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
  fontSize: 48,
  fill: 0xf5e6c8,
  fontWeight: 'bold',
  stroke: { color: 0x1a1208, width: 6, join: 'round' },
});

export class LevelSelectScene {
  readonly root = new Container();
  private design = new Container();

  private constructor(
    private app: Application,
    onPick: (id: LevelId) => void,
    onBack: () => void
  ) {
    this.root.addChild(this.design);

    const bg = Sprite.from('/sprites/titleBG.png');
    bg.width = DESIGN_W;
    bg.height = DESIGN_H;
    bg.tint = 0x888888;
    this.design.addChild(bg);

    const title = new Text({ text: 'Pick a toilet', style: TITLE_STYLE });
    title.anchor.set(0.5);
    title.x = DESIGN_W / 2;
    title.y = 260;
    this.design.addChild(title);

    const gas = makeButton(LEVELS.gasStation.name, 360, 80);
    gas.x = DESIGN_W / 2;
    gas.y = 900;
    gas.on('pointertap', () => {
      audioManager.unlock();
      Globals.selectedLevel = 'gasStation';
      onPick('gasStation');
    });
    this.design.addChild(gas);

    const porta = makeButton(LEVELS.portaPotty.name, 360, 80);
    porta.x = DESIGN_W / 2;
    porta.y = 1020;
    porta.on('pointertap', () => {
      audioManager.unlock();
      Globals.selectedLevel = 'portaPotty';
      onPick('portaPotty');
    });
    this.design.addChild(porta);

    const back = makeButton('Back', 200, 56, true);
    back.x = DESIGN_W / 2;
    back.y = 1600;
    back.on('pointertap', () => onBack());
    this.design.addChild(back);

    this.layout();
    this.app.renderer.on('resize', this.layout);
  }

  static async create(
    app: Application,
    onPick: (id: LevelId) => void,
    onBack: () => void
  ): Promise<LevelSelectScene> {
    await Assets.load('/sprites/titleBG.png');
    return new LevelSelectScene(app, onPick, onBack);
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
