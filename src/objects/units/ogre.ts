import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, Unit } from "./unit";

export class Ogre extends Unit {
  constructor(add: Phaser.GameObjects.GameObjectFactory, flipX?: boolean) {
    const imageData: IImageData = {
      key: EImageKey.Ogre,
      path: "assets/images/ogre.png",
      scale: 0.35,
      startingDir: -1,
    };

    super(add, EUnitType.Ogre, 1, 3, imageData, flipX);
  }
}
