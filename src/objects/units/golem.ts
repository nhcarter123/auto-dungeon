import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, Unit } from "./unit";

export class Golem extends Unit {
  constructor(add: Phaser.GameObjects.GameObjectFactory, flipX?: boolean) {
    const imageData: IImageData = {
      key: EImageKey.Golem,
      path: "assets/images/golem.png",
      scale: 0.2,
      startingDir: -1,
    };

    super(add, EUnitType.Golem, 1, 2, imageData, flipX);
  }
}
