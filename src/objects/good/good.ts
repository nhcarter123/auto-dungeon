import Phaser from "phaser";
import { nanoid } from "nanoid";
import { lerp } from "../../helpers/math";
import { EItemType } from "./items/item";
import { EUnitType, IImageData } from "./units/unit";

type TGoodType = EItemType | EUnitType;

export type TGoodOverrides = Partial<
  Pick<Good, "cost" | "id" | "facingDir" | "x" | "y">
>;

export class Good {
  public id: string;
  public depth: number;
  public cost: number;
  public facingDir: number;
  public x: number;
  public y: number;
  public gameObject: Phaser.GameObjects.Image;
  public scale: number;
  public scaleMod: number;
  public imageData: IImageData;
  public type: TGoodType;

  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    type: TGoodType,
    imageData: IImageData,
    overrides: TGoodOverrides
  ) {
    this.id = overrides.id === undefined ? nanoid() : overrides.id;
    this.x = overrides.x === undefined ? 1 : overrides.x;
    this.y = overrides.y === undefined ? 1 : overrides.y;
    this.facingDir =
      overrides.facingDir === undefined ? 1 : overrides.facingDir;
    this.imageData = imageData;
    this.type = type;
    this.cost = 3;
    this.depth = 0;
    this.scale = 1;
    this.scaleMod = 1;
    this.gameObject = add.image(this.x, this.y, this.imageData.key);
    this.gameObject.scale =
      this.scale * this.scaleMod * this.imageData.scale * 0.7;
    this.gameObject.x = this.x;
    this.gameObject.y = this.y;
  }

  getDescription(): string {
    return "No effect.";
  }

  update() {
    this.gameObject.scale = lerp(
      this.gameObject.scale,
      this.scale * this.scaleMod * this.imageData.scale,
      0.2
    );
  }

  delete() {
    this.gameObject?.destroy();
  }
}
