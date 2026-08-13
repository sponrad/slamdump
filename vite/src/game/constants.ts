/**
 * Design resolution matches Unity BG sprites (1080×1920 portrait).
 * Water / play ellipses are tunable — Unity scenes were binary so shapes are estimated.
 */

export const DESIGN_W = 1080;
export const DESIGN_H = 1920;

export type LevelId = 'gasStation' | 'portaPotty';

export type BugKind = 'orangeRoach' | 'greenPincher' | 'wormBig' | 'wormSmall' | 'golden';

export type Ellipse = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

export type LevelConfig = {
  id: LevelId;
  name: string;
  bg: string;
  /** Inner water — spawn + inWater */
  water: Ellipse;
  /** Outer toilet play area — leaving = game over */
  playArea: Ellipse;
  enemyKinds: BugKind[];
  introBugs: number;
  delayModifier: number;
  rewardBugChance: number;
};

/**
 * Tuned from BG pixel traces (press 0 in dev to verify).
 * Water = inner bowl well (murky water / drain). Play = outer seat oval (leave toilet = game over).
 */
const GAS_WATER: Ellipse = { cx: 540, cy: 1110, rx: 240, ry: 315 };
const GAS_PLAY: Ellipse = { cx: 530, cy: 1090, rx: 540, ry: 605 };

const PORTA_WATER: Ellipse = { cx: 538, cy: 1105, rx: 240, ry: 315 };
const PORTA_PLAY: Ellipse = { cx: 540, cy: 1100, rx: 540, ry: 560 };

export const LEVELS: Record<LevelId, LevelConfig> = {
  gasStation: {
    id: 'gasStation',
    name: 'Gas Station',
    bg: '/sprites/BGgasstation.png',
    water: GAS_WATER,
    playArea: GAS_PLAY,
    enemyKinds: ['orangeRoach', 'greenPincher', 'wormBig', 'wormSmall'],
    introBugs: 5,
    delayModifier: 4,
    rewardBugChance: 0.1,
  },
  portaPotty: {
    id: 'portaPotty',
    name: 'Porta Potty',
    bg: '/sprites/BGportapotty.png',
    water: PORTA_WATER,
    playArea: PORTA_PLAY,
    enemyKinds: ['orangeRoach', 'greenPincher', 'wormBig', 'wormSmall'],
    introBugs: 5,
    delayModifier: 3.5,
    rewardBugChance: 0.12,
  },
};

export const BUG_DEFS: Record<
  BugKind,
  {
    sprite: string;
    splatSprite?: string;
    speed: number;
    minSpeed: number;
    displayScale: number;
    /** Roaches move along local up; worms along -right (Unity). */
    moveAxis: 'up' | 'left';
    hitRadius: number;
    isGolden?: boolean;
    isBigWorm?: boolean;
  }
> = {
  orangeRoach: {
    sprite: '/sprites/orangeroach.png',
    splatSprite: '/sprites/orangeRoachSplat.png',
    speed: 40,
    minSpeed: 10,
    displayScale: 0.85,
    moveAxis: 'up',
    hitRadius: 36,
  },
  greenPincher: {
    sprite: '/sprites/greenpincher.png',
    splatSprite: '/sprites/greenpincherSplat.png',
    speed: 36,
    minSpeed: 10,
    displayScale: 0.8,
    moveAxis: 'up',
    hitRadius: 40,
  },
  wormBig: {
    sprite: '/sprites/worm1.png',
    splatSprite: '/sprites/worm11.png',
    speed: 32,
    minSpeed: 8,
    displayScale: 0.28,
    moveAxis: 'left',
    hitRadius: 48,
    isBigWorm: true,
  },
  wormSmall: {
    sprite: '/sprites/worm2.png',
    splatSprite: '/sprites/worm21.png',
    speed: 38,
    minSpeed: 10,
    displayScale: 0.35,
    moveAxis: 'left',
    hitRadius: 32,
  },
  golden: {
    sprite: '/sprites/gondelroach.png',
    splatSprite: '/sprites/orangeRoachSplat.png',
    speed: 48,
    minSpeed: 16,
    displayScale: 0.85,
    moveAxis: 'up',
    hitRadius: 36,
    isGolden: true,
  },
};

export const POO_SPRITES = ['/sprites/poop1.png', '/sprites/poop2.png', '/sprites/poop3.png'];
/** ~1s from top of toilet to water at design resolution. */
export const POO_SPEED = 1100;
export const POO_LIFE = 3.5;
export const POO_ROTATION_RANGE = 10;
export const POO_HIT_RADIUS = 72;
export const POO_DISPLAY_SCALE = 1.05;
export const POO_SPAWN_Y = 40;
export const POO_SPAWN_X_PAD = 80;

export const WORM_OFFSPRING_DELAY = 1.5;
/** Unity RippleScript: ~2s cap, but alpha 0.05/frame dies first (~0.33s). */
export const RIPPLE_LIFE = 2;
export const RIPPLE_START_SCALE = 0.95;
export const SHAKE_AMOUNT = 12;
export const SHAKE_DURATION = 0.2;

export const FIRST_SPAWN_DELAY = 2;
