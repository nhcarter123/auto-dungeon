import Phaser from "phaser";
import { BaseAnim } from "./baseAnim";

export class BuffAnim extends BaseAnim {
  readonly gameObject: Phaser.GameObjects.Arc;

  constructor(
    id: string,
    x: number,
    y: number,
    add: Phaser.GameObjects.GameObjectFactory
  ) {
    super(id, x, y);

    this.gameObject = add.circle(x, y, 14, 0xffffff, 1);
  }

  update() {
    this.gameObject.x = this.x;
    this.gameObject.y = this.y;
  }

  destroy() {
    this.gameObject.destroy();
  }
}
