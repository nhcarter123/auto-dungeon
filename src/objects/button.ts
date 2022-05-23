import { EImageKey } from "./unit";
import { lerp } from "../utils";
import Phaser from "phaser";

export class Button {
  private gameObject: Phaser.GameObjects.Image;
  private hovered: boolean;
  readonly scale: number;
  readonly onClick: Function;

  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    onClick: Function
  ) {
    this.hovered = false;
    this.gameObject = add
      .image(x, y, EImageKey.RollButton)
      .setInteractive()
      .on("pointerdown", () => this.click())
      .on("pointerover", () => (this.hovered = true))
      .on("pointerout", () => (this.hovered = false));

    this.scale = 0.75;
    this.gameObject.scale = this.scale;
    this.onClick = onClick;
  }

  click() {
    this.gameObject.scale = this.scale - 0.1;
    this.onClick();
  }

  update() {
    const scaleMod = this.hovered ? 1.05 : 1;

    this.gameObject.scale = lerp(
      this.gameObject.scale,
      this.scale * scaleMod,
      0.25
    );
  }
}
