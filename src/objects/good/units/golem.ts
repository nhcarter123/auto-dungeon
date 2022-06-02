import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";

export class Golem extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Golem,
      scale: 0.2,
      startingDir: -1,
    };

    const defaults: TUnitOverrides = {
      attack: 1,
      health: 5,
    };

    super(add, EUnitType.Golem, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }
}
