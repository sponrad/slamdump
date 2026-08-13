import { Application } from 'pixi.js';
import { Globals, resetForNewGame } from './game/Globals';
import {
  getSound,
  getHighScore,
  getGoldenStool,
  getTotalBugKills,
  getTotalGamesPlayed,
  getTotalShotsFired,
  getTotalHits,
  getLowPowerMode,
  getAntialias,
} from './utils/storage';
import { isCoarsePointerMobile, setupMobileChrome } from './utils/landscape';
import { audioManager } from './audio/AudioManager';
import { startScoreRun } from './utils/leaderboardApi';
import { TitleScene } from './scenes/TitleScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { PlayScene } from './scenes/PlayScene';
import { GameOverScene } from './scenes/GameOverScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import type { LevelId } from './game/constants';

type SceneKey = 'title' | 'levels' | 'play' | 'gameOver' | 'leaderboard';

async function init(): Promise<void> {
  setupMobileChrome();

  Globals.sound = getSound();
  Globals.highScore = getHighScore();
  Globals.goldenStool = getGoldenStool();
  Globals.totalBugKills = getTotalBugKills();
  Globals.totalGamesPlayed = getTotalGamesPlayed();
  Globals.totalShotsFired = getTotalShotsFired();
  Globals.totalHits = getTotalHits();
  Globals.lowPowerMode = getLowPowerMode(isCoarsePointerMobile());
  Globals.antialias = getAntialias(!Globals.lowPowerMode);

  const app = new Application();
  const lowPower = Globals.lowPowerMode;
  const resolution = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 2);

  await app.init({
    canvas: document.querySelector('#game') as HTMLCanvasElement,
    resizeTo: window,
    backgroundColor: 0x2a2520,
    antialias: Globals.antialias,
    autoDensity: true,
    resolution,
    powerPreference: lowPower ? 'low-power' : 'high-performance',
  });

  const canvas = app.canvas;
  canvas.style.touchAction = 'none';
  canvas.style.userSelect = 'none';
  const canvasCss = canvas.style as CSSStyleDeclaration & {
    webkitUserSelect?: string;
    webkitTouchCallout?: string;
    webkitUserDrag?: string;
  };
  canvasCss.webkitUserSelect = 'none';
  canvasCss.webkitTouchCallout = 'none';
  canvasCss.webkitUserDrag = 'none';
  canvas.setAttribute('draggable', 'false');

  const blockGesture = (e: Event): void => {
    e.preventDefault();
  };
  canvas.addEventListener('selectstart', blockGesture);
  canvas.addEventListener('gesturestart', blockGesture);
  canvas.addEventListener('contextmenu', blockGesture);
  canvas.addEventListener('touchstart', blockGesture, { passive: false });
  canvas.addEventListener('touchmove', blockGesture, { passive: false });

  await audioManager.init();

  let current: SceneKey = 'title';
  let returnFromLb: SceneKey = 'title';

  const hideMenus = (): void => {
    title.hide();
    levels.hide();
    gameOver.hide();
    leaderboard.hide();
  };

  const switchTo = (key: SceneKey): void => {
    hideMenus();
    current = key;
    if (key === 'title') {
      play.hide();
      title.show();
    } else if (key === 'levels') {
      play.hide();
      levels.show();
    } else if (key === 'play') {
      play.show();
    } else if (key === 'gameOver') {
      play.freeze();
      gameOver.show();
    } else if (key === 'leaderboard') {
      if (returnFromLb !== 'gameOver') play.hide();
      else play.lowerDebugOverlay();
      leaderboard.show();
    }
  };

  const startPlay = async (id: LevelId): Promise<void> => {
    resetForNewGame();
    void startScoreRun();
    switchTo('play');
    await play.startLevel(id);
  };

  const title = await TitleScene.create(
    app,
    () => switchTo('levels'),
    () => {
      returnFromLb = 'title';
      switchTo('leaderboard');
      void leaderboard.enter();
    }
  );

  const levels = await LevelSelectScene.create(
    app,
    (id) => {
      void startPlay(id);
    },
    () => switchTo('title')
  );

  const play = await PlayScene.create(app, () => {
    switchTo('gameOver');
    gameOver.enter();
  });

  const gameOver = new GameOverScene(
    app,
    () => {
      void startPlay(Globals.selectedLevel);
    },
    () => switchTo('title'),
    () => {
      returnFromLb = 'gameOver';
      switchTo('leaderboard');
      void leaderboard.enter();
    }
  );

  const leaderboard = new LeaderboardScene(app, () => {
    if (returnFromLb === 'gameOver') {
      switchTo('gameOver');
      gameOver.show();
    } else {
      switchTo('title');
    }
  });

  app.stage.addChild(play.root);
  app.stage.addChild(title.root);
  app.stage.addChild(levels.root);
  app.stage.addChild(gameOver.root);
  app.stage.addChild(leaderboard.root);

  levels.hide();
  play.hide();
  gameOver.hide();
  leaderboard.hide();
  title.show();

  const boot = document.getElementById('boot-loader');
  if (boot) {
    boot.classList.add('hidden');
    window.setTimeout(() => boot.remove(), 400);
  }

  void current;
}

void init().catch((err) => {
  console.error(err);
  const boot = document.getElementById('boot-loader');
  if (boot) {
    const p = boot.querySelector('p');
    if (p) p.textContent = 'Failed to load';
  }
});
