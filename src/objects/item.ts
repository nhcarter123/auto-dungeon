import Phaser from "phaser";
import { nanoid } from "nanoid";
import { lerp } from "../utils";
import { EImageKey, IImageData } from "./units/unit";

export enum ItemType {
  Book = "Book",
}

interface ItemDefaultData {
  cost: number;
  imageData: IImageData;
}

export class Item {
  public id: string;
  public depth: number;
  public cost: number;
  public x: number;
  public y: number;
  public gameObject: Phaser.GameObjects.Image;
  public scale: number;
  public scaleMod: number;
  public imageData: IImageData;
  public type: ItemType;

  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    type: ItemType
  ) {
    const { cost, imageData } = this.getDataFromType(type);

    this.imageData = imageData;
    this.id = nanoid();
    this.cost = cost;
    this.type = type;
    this.x = x;
    this.y = y;
    this.depth = 0;
    this.scale = 1;
    this.scaleMod = 1;
    this.gameObject = add.image(x, y, this.imageData.key);
    this.gameObject.scale = this.scale * this.scaleMod * this.imageData.scale;
  }

  update() {
    this.gameObject.scale = lerp(
      this.gameObject.scale,
      this.scale * this.scaleMod * this.imageData.scale,
      0.2
    );
  }

  getDataFromType(type: ItemType): ItemDefaultData {
    switch (type) {
      case ItemType.Book:
      default:
        return {
          cost: 2,
          imageData: {
            key: EImageKey.RollButton,
            path: "assets/images/button_roll.png",
            scale: 0.35,
            startingDir: 1,
          },
        };
    }
  }

  delete() {
    this.gameObject?.destroy();
  }
}
