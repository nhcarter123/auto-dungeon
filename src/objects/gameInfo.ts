import Phaser from "phaser";
import { saveData } from "../index";
import { EImageKey } from "./good/units/unit";
import { lerp } from "../helpers/math";

export class GameInfo {
  public goldIconObject: Phaser.GameObjects.Image;
  public goldObject: Phaser.GameObjects.Text;
  public turnIconObject: Phaser.GameObjects.Image;
  public turnObject: Phaser.GameObjects.Text;
  public scale: number;
  public previousGold: number;

  constructor(add: Phaser.GameObjects.GameObjectFactory, x: number, y: number) {
    this.scale = 0.75;
    this.previousGold = saveData.gold;

    const fontStyle = {
      fontSize: "48px",
      fontFamily: "concert_one",
    };

    this.goldIconObject = add.image(x, y, EImageKey.Gold);
    this.goldIconObject.scale = this.scale;
    this.goldObject = add.text(
      x + 28,
      y - 26,
      saveData.gold.toString(),
      fontStyle
    );

    const turnOffset = 110;

    this.turnIconObject = add.image(x + turnOffset, y, EImageKey.Gold);
    this.turnIconObject.scale = this.scale;
    this.turnObject = add.text(
      x + 28 + turnOffset,
      y - 26,
      saveData.turn.toString(),
      fontStyle
    );
  }

  update() {
    if (this.previousGold !== saveData.gold) {
      this.previousGold = saveData.gold;
      this.goldIconObject.scale = this.scale * 0.8;
      this.goldObject.text = saveData.gold.toString();
    }

    this.turnObject.text = saveData.turn.toString();

    this.goldIconObject.scale = lerp(
      this.goldIconObject.scale,
      this.scale,
      0.1
    );
  }
}
