import Phaser from "phaser";
import { saveData } from "../index";
import { EImageKey } from "./good/units/unit";
import { lerp } from "../helpers/math";
import { Relic } from "./good/relics/relic";
import { Box } from "./good/relics/box";

export class GameInfo {
  readonly goldIconObject: Phaser.GameObjects.Image;
  readonly goldObject: Phaser.GameObjects.Text;
  readonly turnIconObject: Phaser.GameObjects.Image;
  readonly turnObject: Phaser.GameObjects.Text;
  readonly relicObjects: Relic[];
  readonly relicsBackground: Phaser.GameObjects.Rectangle;
  public relicWidth: number;
  public scale: number;
  private previousGold: number;

  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  readonly leftBorder: number;
  readonly rightBorder: number;
  readonly topBorder: number;
  readonly bottomBorder: number;

  constructor(add: Phaser.GameObjects.GameObjectFactory, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.relicWidth = 70;
    this.width = 1290;
    this.height = 60;
    this.leftBorder = this.x + 200;
    this.rightBorder = this.x + this.width + 200;
    this.topBorder = this.y - this.height / 2;
    this.bottomBorder = this.y + this.height / 2;
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

    this.relicObjects = [];
    this.relicsBackground = add.rectangle(
      this.leftBorder + this.width / 2,
      y,
      this.width,
      this.height,
      0xffffff,
      0.25
    );
  }

  update(add: Phaser.GameObjects.GameObjectFactory) {
    for (let i = 0; i < saveData.relics.length; i++) {
      const relic = this.relicObjects[i];

      if (relic) {
        relic.update();
        relic.scaleMod = 1;
      } else {
        const obj = new Box(
          add,
          this.leftBorder + (i + 0.5) * this.relicWidth,
          this.y
        );
        this.relicObjects.push(obj);
      }
    }

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

  hoverRelic(mouseX: number, mouseY: number): Relic | undefined {
    const mouseWithinBox = this.isMouseWithinBox(mouseX, mouseY);

    if (mouseWithinBox) {
      const targetIndex = Math.round(
        (mouseX - this.leftBorder) / this.relicWidth - 0.5
      );

      return this.relicObjects[targetIndex];
    }
  }

  isMouseWithinBox(mouseX: number, mouseY: number): boolean {
    return (
      mouseX > this.leftBorder &&
      mouseX < this.rightBorder &&
      mouseY > this.topBorder &&
      mouseY < this.bottomBorder
    );
  }
}
