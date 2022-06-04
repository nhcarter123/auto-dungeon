import Phaser from "phaser";
import { BaseAnim } from "./baseAnim";

export class DamageNumberAnim extends BaseAnim {
  readonly gameObject: Phaser.GameObjects.Text;
  readonly gameObject2: Phaser.GameObjects.Text;

  constructor(
    id: string,
    x: number,
    y: number,
    damage: number,
    add: Phaser.GameObjects.GameObjectFactory
  ) {
    x -= 60;
    y -= 110;
    super(id, x, y);

    const titleStyle = {
      fontSize: "100px",
      fontFamily: "bangers",
      align: "center",
      fixedWidth: 100,
      color: "#ff2600",
    };

    const titleStyle2 = { ...titleStyle, fontSize: "110px", color: "#000000" };

    this.gameObject = add.text(x, y, damage.toString(), titleStyle);
    this.gameObject2 = add.text(x, y, damage.toString(), titleStyle2);

    this.gameObject.rotation = 0.08;
    this.gameObject2.rotation = 0.08;
    this.gameObject.depth = 11;
    this.gameObject2.depth = 10;
  }

  getXMod(pct: number): number {
    return 3 * pct;
  }

  getYMod(pct: number): number {
    return 5 * Math.sin(pct * 2.8);
  }

  update(pct: number) {
    const absPct = Math.abs(pct);
    const alpha = absPct > 0.8 ? (1 - absPct) / 0.2 : 1;
    const rotation = 0.08 - pct * 0.06;
    const x = this.x + this.getXMod(pct);
    const y = this.y - this.getYMod(pct);

    this.gameObject.alpha = alpha;
    this.gameObject.rotation = rotation;
    this.gameObject.x = x;
    this.gameObject.y = y;

    this.gameObject2.alpha = alpha;
    this.gameObject2.rotation = rotation;
    this.gameObject2.x = x + 5;
    this.gameObject2.y = y - 2;
  }

  destroy() {
    this.gameObject.destroy();
    this.gameObject2.destroy();
  }
}
