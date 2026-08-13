/** Format a score for display (e.g. 1750 → "1,750"). */
export function formatScore(score: number): string {
  const n = Math.max(0, Math.floor(Number(score) || 0));
  return n.toLocaleString('en-US');
}
