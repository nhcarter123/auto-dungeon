import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";

export class Ogre extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Ogre,
      path: "assets/images/ogre.png",
      scale: 0.35,
      startingDir: -1,
    };

    const defaults: TUnitOverrides = {
      attack: 1,
      health: 3,
    };

    super(add, EUnitType.Ogre, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }
}
