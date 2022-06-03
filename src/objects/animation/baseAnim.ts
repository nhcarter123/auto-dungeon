export class BaseAnim {
  public x: number;
  public y: number;
  readonly id: string;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }

  update(pct?: number) {}

  destroy() {}
}
