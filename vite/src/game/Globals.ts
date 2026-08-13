/**
 * Global game state (port of Unity Globals.cs).
 */

export const Globals = {
  sound: true,
  lowPowerMode: false,
  antialias: true,
  score: 0,
  goldenStool: 0,
  highScore: 0,
  totalBugKills: 0,
  totalGamesPlayed: 0,
  totalShotsFired: 0,
  totalHits: 0,
  tempGameBugsKilled: 0,
  tempShotsFired: 0,
  inGame: false,
  selectedLevel: 'gasStation' as 'gasStation' | 'portaPotty',
};

export function resetForNewGame(): void {
  Globals.score = 0;
  Globals.tempGameBugsKilled = 0;
  Globals.tempShotsFired = 0;
  Globals.inGame = true;
}

export function commitGameOverStats(): void {
  Globals.totalBugKills += Globals.tempGameBugsKilled;
  Globals.totalGamesPlayed += 1;
  Globals.totalShotsFired += Globals.tempShotsFired;
  Globals.totalHits += Globals.tempGameBugsKilled;
}
