import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";

export class ArmoredOrc extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.ArmoredOrc,
      scale: 0.25,
      startingDir: -1,
    };

    const defaults: TUnitOverrides = {
      attack: 2,
      health: 2,
    };

    super(add, EUnitType.ArmoredOrc, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  getDescription(): string {
    return `Takes ${this.getArmor()} less damage`;
  }

  getArmor(): number {
    return 2 * (this.getLevel() - 1) + 1;
  }
}
