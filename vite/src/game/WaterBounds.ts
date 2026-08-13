import type { Ellipse } from './constants';

export function pointInEllipse(x: number, y: number, e: Ellipse): boolean {
  const dx = (x - e.cx) / e.rx;
  const dy = (y - e.cy) / e.ry;
  return dx * dx + dy * dy <= 1;
}

/** Rejection-sample a random point inside the ellipse. */
export function randomPointInEllipse(e: Ellipse, maxTries = 40): { x: number; y: number } {
  for (let i = 0; i < maxTries; i++) {
    const x = e.cx - e.rx + Math.random() * e.rx * 2;
    const y = e.cy - e.ry + Math.random() * e.ry * 2;
    if (pointInEllipse(x, y, e)) return { x, y };
  }
  return { x: e.cx, y: e.cy };
}
