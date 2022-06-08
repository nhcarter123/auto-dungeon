import { Good } from "../good";
import { IImageData } from "../units/unit";
import Phaser from "phaser";

export enum ERelicType {
  Box = "Box",
}

export class Relic extends Good {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    type: ERelicType,
    imageData: IImageData
  ) {
    super(add, type, imageData, { x, y });
  }
}
