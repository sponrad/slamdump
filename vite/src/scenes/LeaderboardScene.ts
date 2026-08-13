import {
  Container,
  Graphics,
  Text,
  TextStyle,
  type Application,
} from 'pixi.js';
import { DESIGN_H, DESIGN_W } from '../game/constants';
import { fetchScores, type ScoreEntry } from '../utils/leaderboardApi';
import { makeButton, fitDesignToScreen } from '../ui/ui';
import { formatScore } from '../utils/format';

const TITLE_STYLE = new TextStyle({
  fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
  fontSize: 48,
  fill: 0xf5e6c8,
  fontWeight: 'bold',
  stroke: { color: 0x1a1208, width: 6, join: 'round' },
});

const ROW_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 28,
  fill: 0xffffff,
  fontWeight: 'bold',
  stroke: { color: 0x000000, width: 3, join: 'round' },
});

const MUTED_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 22,
  fill: 0xcccccc,
  stroke: { color: 0x000000, width: 3, join: 'round' },
});

export class LeaderboardScene {
  readonly root = new Container();
  private design = new Container();
  private list = new Container();
  private status: Text;

  constructor(
    private app: Application,
    private onBack: () => void
  ) {
    this.root.addChild(this.design);

    const dim = new Graphics();
    dim.rect(0, 0, DESIGN_W, DESIGN_H).fill({ color: 0x1a1208, alpha: 0.85 });
    this.design.addChild(dim);

    const title = new Text({ text: 'Leaderboard', style: TITLE_STYLE });
    title.anchor.set(0.5);
    title.x = DESIGN_W / 2;
    title.y = 220;
    this.design.addChild(title);

    this.status = new Text({ text: 'Loading…', style: MUTED_STYLE });
    this.status.anchor.set(0.5);
    this.status.x = DESIGN_W / 2;
    this.status.y = 320;
    this.design.addChild(this.status);

    this.list.y = 380;
    this.design.addChild(this.list);

    const back = makeButton('Back', 200, 56, true);
    back.x = DESIGN_W / 2;
    back.y = 1700;
    back.on('pointertap', () => this.onBack());
    this.design.addChild(back);

    this.layout();
    this.app.renderer.on('resize', this.layout);
  }

  async enter(): Promise<void> {
    this.show();
    this.list.removeChildren();
    this.status.text = 'Loading…';
    try {
      const scores = await fetchScores();
      this.renderScores(scores);
    } catch {
      this.status.text = 'Leaderboard unavailable';
    }
  }

  private renderScores(scores: ScoreEntry[]): void {
    this.list.removeChildren();
    if (scores.length === 0) {
      this.status.text = 'No scores yet — be the first!';
      return;
    }
    this.status.text = '';
    scores.forEach((entry, i) => {
      const row = new Text({
        text: `${i + 1}. ${entry.name}  —  ${formatScore(entry.score)}`,
        style: ROW_STYLE,
      });
      row.anchor.set(0.5, 0);
      row.x = DESIGN_W / 2;
      row.y = i * 56;
      this.list.addChild(row);
    });
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
