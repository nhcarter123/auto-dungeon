import Phaser from "phaser";
import { Good } from "./good/good";

export class ToolTip {
  public x: number;
  public y: number;
  private backgroundObject: Phaser.GameObjects.Rectangle;
  private titleObject: Phaser.GameObjects.Text;
  private descriptionObject: Phaser.GameObjects.Text;
  public source: Good | undefined;
  // public scale: number;
  // public scaleMod: number;

  constructor(add: Phaser.GameObjects.GameObjectFactory, x: number, y: number) {
    this.x = x;
    this.y = y;
    // this.scale = 1;
    // this.scaleMod = 1;

    const padding = 20;
    const width = 400;
    const height = 150;

    const titleStyle = {
      fontSize: "34px",
      fontFamily: "bangers",
      align: "center",
      fixedWidth: width,
      color: "#ffb252",
    };

    const descriptionStyle = {
      fontSize: "24px",
      fontFamily: "concert_one",
      wordWrap: { width: width - 2 * padding, useAdvancedWrap: true },
    };

    const title = this.getTitle(this.source?.type || "");
    const description = this.source?.getDescription() || "";

    this.backgroundObject = add.rectangle(x, y, width, height, 0x292929, 1);
    this.titleObject = add
      .text(x, y - height / 2 + 30, title, titleStyle)
      .setOrigin(0.5);
    this.descriptionObject = add.text(
      x - width / 2 + padding,
      y - height / 2 + 60,
      description,
      descriptionStyle
    );

    this.update();
  }

  getTitle(str: string) {
    // Split camel case
    return str.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  setVisible(visible: boolean) {
    this.backgroundObject.visible = visible;
    this.titleObject.visible = visible;
    this.descriptionObject.visible = visible;
  }

  update() {
    if (this.source) {
      this.titleObject.text = this.getTitle(this.source.type);
      this.descriptionObject.text = this.source.getDescription();
      this.setVisible(true);
    } else {
      this.setVisible(false);
    }
    this.source = undefined;
  }
}
