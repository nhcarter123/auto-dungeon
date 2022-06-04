import Phaser from "phaser";
import { saveData } from "../index";
import { EImageKey } from "./good/units/unit";
import { lerp } from "../helpers/math";

export class GameInfo {
  readonly goldIconObject: Phaser.GameObjects.Image;
  readonly goldObject: Phaser.GameObjects.Text;
  readonly turnIconObject: Phaser.GameObjects.Image;
  readonly turnObject: Phaser.GameObjects.Text;
  readonly relics: Phaser.GameObjects.Image[];
  readonly relicsBackground: Phaser.GameObjects.Rectangle;
  public scale: number;
  readonly width: number;
  private previousGold: number;

  constructor(add: Phaser.GameObjects.GameObjectFactory, x: number, y: number) {
    this.width = 1290;
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

    this.relics = [];
    this.relicsBackground = add.rectangle(
      x + this.width / 2 + 200,
      y,
      this.width,
      60,
      0xffffff,
      0.25
    );
  }

  update() {
    // for (const relic of saveData.relics)

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
