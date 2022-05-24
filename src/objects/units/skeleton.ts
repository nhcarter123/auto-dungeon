import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, Unit } from "./unit";

export class Skeleton extends Unit {
  constructor(add: Phaser.GameObjects.GameObjectFactory, flipX?: boolean) {
    const imageData: IImageData = {
      key: EImageKey.Skeleton,
      path: "assets/images/skeleton.png",
      scale: 0.35,
      startingDir: 1,
    };

    super(add, EUnitType.Skeleton, 1, 2, imageData, flipX);
  }
}
