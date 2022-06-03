import Phaser from "phaser";
import { BaseAnim } from "./baseAnim";

export class DamageNumberAnim extends BaseAnim {
  readonly gameObject: Phaser.GameObjects.Text;

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
      color: "#ffbf00",
    };

    this.gameObject = add.text(x, y, damage.toString(), titleStyle);
    this.gameObject.rotation = 0.08;
    this.gameObject.depth = 10;
  }

  getXMod(pct: number): number {
    return 3 * pct;
  }

  getYMod(pct: number): number {
    return 5 * Math.sin(pct * 2.8);
  }

  update(pct: number) {
    const absPct = Math.abs(pct);
    this.gameObject.alpha = absPct > 0.8 ? (1 - absPct) / 0.2 : 1;
    this.gameObject.rotation = 0.08 - pct * 0.06;
    this.gameObject.x = this.x + this.getXMod(pct);
    this.gameObject.y = this.y - this.getYMod(pct);
  }

  destroy() {
    this.gameObject.destroy();
  }
}
