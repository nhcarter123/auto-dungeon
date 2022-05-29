import Phaser from "phaser";
import { IImageData } from "../units/unit";
import { Good, TGoodOverrides } from "../good";

export enum EItemType {
  Book = "Book",
}

// TODO: this class MAY be useful if Items (across the board) end up having any attributes that Units do not have.
//  Currently this is not the case.

export class Item extends Good {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    type: EItemType,
    imageData: IImageData,
    overrides: TGoodOverrides
  ) {
    super(add, type, imageData, overrides);
  }
}
