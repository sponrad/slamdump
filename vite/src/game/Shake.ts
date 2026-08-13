import { SHAKE_AMOUNT, SHAKE_DURATION } from './constants';

/** Camera shake state (port of CameraShake.cs). */
export class Shake {
  duration = 0;
  amount = SHAKE_AMOUNT;
  private baseX = 0;
  private baseY = 0;

  setBase(x: number, y: number): void {
    this.baseX = x;
    this.baseY = y;
  }

  trigger(duration = SHAKE_DURATION): void {
    this.duration = Math.max(this.duration, duration);
  }

  get active(): boolean {
    return this.duration > 0;
  }

  /** Returns offset to apply to world container. */
  update(dt: number): { x: number; y: number } {
    if (this.duration <= 0) {
      return { x: this.baseX, y: this.baseY };
    }
    this.duration -= dt;
    if (this.duration <= 0) {
      this.duration = 0;
      return { x: this.baseX, y: this.baseY };
    }
    const ox = (Math.random() * 2 - 1) * this.amount;
    const oy = (Math.random() * 2 - 1) * this.amount;
    return { x: this.baseX + ox, y: this.baseY + oy };
  }
}
