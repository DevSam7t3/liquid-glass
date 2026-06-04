/**
 * Damped spring physics — drives all animations in the liquid-glass
 * components (scale, position, opacity, displacement scale, etc.).
 */
export class Spring {
  value: number;
  target: number;
  velocity: number;
  stiffness: number;
  damping: number;

  constructor(value: number, stiffness = 300, damping = 20) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  setTarget(t: number): void {
    this.target = t;
  }

  update(dt: number): number {
    const force = (this.target - this.value) * this.stiffness;
    const drag = this.velocity * this.damping;
    this.velocity += (force - drag) * dt;
    this.value += this.velocity * dt;
    return this.value;
  }

  isSettled(): boolean {
    return Math.abs(this.target - this.value) < 0.001 && Math.abs(this.velocity) < 0.001;
  }
}
