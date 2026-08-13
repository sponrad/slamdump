import {
  Container,
  Graphics,
  Text,
  TextStyle,
  type Application,
} from 'pixi.js';
import { Globals, commitGameOverStats } from '../game/Globals';
import { DESIGN_H, DESIGN_W } from '../game/constants';
import {
  getLastName,
  persistGlobalsStats,
  setLastName,
  DEFAULT_NAME,
} from '../utils/storage';
import {
  fetchScores,
  qualifiesForLeaderboard,
  submitScore,
  clearScoreRun,
  hasScoreRun,
} from '../utils/leaderboardApi';
import { makeButton, fitDesignToScreen } from '../ui/ui';
import { formatScore } from '../utils/format';
import { ScoreSavePrompt } from '../ui/scoreSavePrompt';

const TITLE_STYLE = new TextStyle({
  fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
  fontSize: 56,
  fill: 0xf5e6c8,
  fontWeight: 'bold',
  stroke: { color: 0x1a1208, width: 6, join: 'round' },
});

const BODY_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 36,
  fill: 0xffffff,
  fontWeight: 'bold',
  stroke: { color: 0x000000, width: 4, join: 'round' },
});

const MSG_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 28,
  fill: 0xffe08a,
  fontWeight: 'bold',
  stroke: { color: 0x000000, width: 4, join: 'round' },
});

export class GameOverScene {
  readonly root = new Container();
  private design = new Container();
  private scoreLabel: Text;
  private messageLabel: Text;
  private prompt: ScoreSavePrompt;
  private pendingAfterPrompt: (() => void) | null = null;

  constructor(
    private app: Application,
    private onPlayAgain: () => void,
    private onTitle: () => void,
    private onLeaderboard: () => void
  ) {
    this.root.eventMode = 'static';
    this.root.addChild(this.design);

    const dim = new Graphics();
    dim.rect(0, 0, DESIGN_W, DESIGN_H).fill({ color: 0x1a1208, alpha: 0.32 });
    this.design.addChild(dim);

    const title = new Text({ text: 'Game Over', style: TITLE_STYLE });
    title.anchor.set(0.5);
    title.x = DESIGN_W / 2;
    title.y = 420;
    this.design.addChild(title);

    this.scoreLabel = new Text({ text: '0', style: BODY_STYLE });
    this.scoreLabel.anchor.set(0.5);
    this.scoreLabel.x = DESIGN_W / 2;
    this.scoreLabel.y = 560;
    this.design.addChild(this.scoreLabel);

    this.messageLabel = new Text({ text: '', style: MSG_STYLE });
    this.messageLabel.anchor.set(0.5);
    this.messageLabel.x = DESIGN_W / 2;
    this.messageLabel.y = 640;
    this.design.addChild(this.messageLabel);

    const again = makeButton('Play again', 300, 72);
    again.x = DESIGN_W / 2;
    again.y = 1100;
    again.on('pointertap', () => this.finishThen(this.onPlayAgain));
    this.design.addChild(again);

    const titleBtn = makeButton('Title', 220, 56, true);
    titleBtn.x = DESIGN_W / 2;
    titleBtn.y = 1220;
    titleBtn.on('pointertap', () => this.finishThen(this.onTitle));
    this.design.addChild(titleBtn);

    const lb = makeButton('Leaderboard', 280, 56, true);
    lb.x = DESIGN_W / 2;
    lb.y = 1320;
    lb.on('pointertap', () => this.finishThen(this.onLeaderboard));
    this.design.addChild(lb);

    this.prompt = new ScoreSavePrompt({
      onSave: (name) => void this.saveScore(name),
      onSkip: () => this.closePrompt(),
    });

    this.layout();
    this.app.renderer.on('resize', this.layout);
  }

  enter(): void {
    commitGameOverStats();

    const isNewBest = Globals.score > Globals.highScore;
    if (isNewBest) {
      Globals.highScore = Globals.score;
      this.messageLabel.text = 'New High Score!';
    } else {
      this.messageLabel.text = `High score: ${formatScore(Globals.highScore)}`;
    }

    this.scoreLabel.text = `Score: ${formatScore(Globals.score)}`;

    persistGlobalsStats(Globals);

    this.show();
    void this.maybePromptLeaderboard(isNewBest);
  }

  private async maybePromptLeaderboard(isNewBest: boolean): Promise<void> {
    if (!hasScoreRun() || Globals.score <= 0) return;
    try {
      const scores = await fetchScores();
      if (!qualifiesForLeaderboard(Globals.score, scores)) return;
      this.prompt.show(Globals.score, getLastName() || DEFAULT_NAME, isNewBest);
    } catch {
      // Leaderboard optional offline
    }
  }

  private async saveScore(name: string): Promise<void> {
    setLastName(name);
    try {
      await submitScore(Globals.score, name, Globals.goldenStool);
    } catch (e) {
      console.warn('Score submit failed', e);
      clearScoreRun();
    }
    this.closePrompt();
  }

  private closePrompt(): void {
    this.prompt.hide();
    clearScoreRun();
    const next = this.pendingAfterPrompt;
    this.pendingAfterPrompt = null;
    next?.();
  }

  private finishThen(fn: () => void): void {
    if (this.prompt.isOpen()) {
      this.pendingAfterPrompt = fn;
      this.prompt.hide();
      clearScoreRun();
      fn();
      this.pendingAfterPrompt = null;
      return;
    }
    fn();
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
    this.root.hitArea = this.app.screen;
  };

  show(): void {
    this.root.visible = true;
  }

  hide(): void {
    this.root.visible = false;
    this.prompt.hide();
  }

  destroy(): void {
    this.app.renderer.off('resize', this.layout);
    this.root.destroy({ children: true });
  }
}
