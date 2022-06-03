import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";

export class Orc extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Orc,
      scale: 0.25,
      startingDir: -1,
    };

    const defaults: TUnitOverrides = {
      attack: 2,
      health: 1,
    };

    super(add, EUnitType.Orc, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  getDescription(): string {
    return `Deals excess damage to the next unit`;
  }
}
