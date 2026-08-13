/**
 * Local prefs: sound, high score, golden stool, stats, last leaderboard name.
 */

const KEY_SOUND = 'slamdump_sound';
const KEY_HIGH_SCORE = 'slamdump_highScore';
const KEY_GOLDEN = 'slamdump_goldenStool';
const KEY_TOTAL_KILLS = 'slamdump_totalBugKills';
const KEY_TOTAL_GAMES = 'slamdump_totalGamesPlayed';
const KEY_TOTAL_SHOTS = 'slamdump_totalShotsFired';
const KEY_TOTAL_HITS = 'slamdump_totalHits';
const KEY_LAST_NAME = 'slamdump_lastName';
const KEY_LOW_POWER = 'slamdump_lowPower';
const KEY_ANTIALIAS = 'slamdump_antialias';

export const MAX_SCORES = 10;
export const MAX_NAME_LEN = 12;
export const DEFAULT_NAME = 'Larry';

export type ScoreEntry = {
  score: number;
  name: string;
  at: number;
  goldenStool: number;
};

function getInt(key: string, fallback = 0): number {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? Math.max(0, parseInt(v, 10) || 0) : fallback;
  } catch {
    return fallback;
  }
}

function setInt(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
  } catch {
    // ignore
  }
}

export function getSound(): boolean {
  try {
    const v = localStorage.getItem(KEY_SOUND);
    return v === null || v === '1';
  } catch {
    return true;
  }
}

export function setSound(on: boolean): void {
  try {
    localStorage.setItem(KEY_SOUND, on ? '1' : '0');
  } catch {
    // ignore
  }
}

export function getLowPowerMode(defaultOn: boolean): boolean {
  try {
    const v = localStorage.getItem(KEY_LOW_POWER);
    if (v === null) return defaultOn;
    return v === '1';
  } catch {
    return defaultOn;
  }
}

export function setLowPowerMode(on: boolean): void {
  try {
    localStorage.setItem(KEY_LOW_POWER, on ? '1' : '0');
  } catch {
    // ignore
  }
}

export function getAntialias(defaultOn: boolean): boolean {
  try {
    const v = localStorage.getItem(KEY_ANTIALIAS);
    if (v === null) return defaultOn;
    return v === '1';
  } catch {
    return defaultOn;
  }
}

export function setAntialias(on: boolean): void {
  try {
    localStorage.setItem(KEY_ANTIALIAS, on ? '1' : '0');
  } catch {
    // ignore
  }
}

export function getHighScore(): number {
  return getInt(KEY_HIGH_SCORE);
}

export function setHighScore(score: number): void {
  setInt(KEY_HIGH_SCORE, score);
}

export function getGoldenStool(): number {
  return getInt(KEY_GOLDEN);
}

export function setGoldenStool(n: number): void {
  setInt(KEY_GOLDEN, n);
}

export function getTotalBugKills(): number {
  return getInt(KEY_TOTAL_KILLS);
}
export function setTotalBugKills(n: number): void {
  setInt(KEY_TOTAL_KILLS, n);
}

export function getTotalGamesPlayed(): number {
  return getInt(KEY_TOTAL_GAMES);
}
export function setTotalGamesPlayed(n: number): void {
  setInt(KEY_TOTAL_GAMES, n);
}

export function getTotalShotsFired(): number {
  return getInt(KEY_TOTAL_SHOTS);
}
export function setTotalShotsFired(n: number): void {
  setInt(KEY_TOTAL_SHOTS, n);
}

export function getTotalHits(): number {
  return getInt(KEY_TOTAL_HITS);
}
export function setTotalHits(n: number): void {
  setInt(KEY_TOTAL_HITS, n);
}

export function getLastName(): string {
  try {
    const v = localStorage.getItem(KEY_LAST_NAME);
    if (v) return sanitizeName(v);
  } catch {
    // ignore
  }
  return '';
}

export function setLastName(name: string): void {
  try {
    localStorage.setItem(KEY_LAST_NAME, sanitizeName(name));
  } catch {
    // ignore
  }
}

export function sanitizeName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LEN);
  return cleaned || DEFAULT_NAME;
}

export function persistGlobalsStats(g: {
  goldenStool: number;
  highScore: number;
  totalBugKills: number;
  totalGamesPlayed: number;
  totalShotsFired: number;
  totalHits: number;
}): void {
  setGoldenStool(g.goldenStool);
  setHighScore(g.highScore);
  setTotalBugKills(g.totalBugKills);
  setTotalGamesPlayed(g.totalGamesPlayed);
  setTotalShotsFired(g.totalShotsFired);
  setTotalHits(g.totalHits);
}
