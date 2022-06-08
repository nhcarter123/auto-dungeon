import { ERelicType, Relic } from "./relic";
import Phaser from "phaser";
import { EImageKey } from "../units/unit";

export class Box extends Relic {
  constructor(add: Phaser.GameObjects.GameObjectFactory, x: number, y: number) {
    const type = ERelicType.Box;
    const imageData = {
      key: EImageKey.Gold,
      scale: 0.7,
      startingDir: 1,
    };

    super(add, x, y, type, imageData);
  }
}
