import { EImageKey } from "./units/unit";
import { lerp } from "../utils";
import Phaser from "phaser";
import { EMouseEvent } from "../scenes/planning";

export class Button {
  public gameObject: Phaser.GameObjects.Image;
  public hovered: boolean;
  readonly scale: number;
  readonly onClick: Function;

  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    key: EImageKey,
    x: number,
    y: number,
    onClick: Function
  ) {
    this.hovered = false;
    this.gameObject = add
      .image(x, y, key)
      .setInteractive()
      .on(EMouseEvent.PointerDown, () => this.click())
      .on(EMouseEvent.PointerOver, () => (this.hovered = true))
      .on(EMouseEvent.PointerOut, () => (this.hovered = false));

    this.scale = 0.75;
    this.gameObject.scale = this.scale;
    this.onClick = onClick;
  }

  click() {
    this.gameObject.scale = this.scale - 0.1;
    this.onClick();
  }

  update(allowHover: boolean) {
    const scaleMod = this.hovered && allowHover ? 1.05 : 1;

    this.gameObject.scale = lerp(
      this.gameObject.scale,
      this.scale * scaleMod,
      0.25
    );
  }
}
