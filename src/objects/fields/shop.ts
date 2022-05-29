import Phaser from "phaser";
import { Field } from "./field";
import { createUnitFromType, getRandomUnitType } from "../../helpers/unit";
import { Good } from "../good/good";

export class Shop extends Field<Good> {
  public size: number;
  private add: Phaser.GameObjects.GameObjectFactory | undefined;

  constructor(x: number, y: number, width: number) {
    super(x, y, width);

    this.size = 5;
  }

  create(add: Phaser.GameObjects.GameObjectFactory) {
    super.create(add);

    this.add = add;
    this.generateGoods();
  }

  generateGoods() {
    if (this.add) {
      this.contents = [
        createUnitFromType(this.add, getRandomUnitType()),
        createUnitFromType(this.add, getRandomUnitType()),
        createUnitFromType(this.add, getRandomUnitType()),
        createUnitFromType(this.add, getRandomUnitType()),
        createUnitFromType(this.add, getRandomUnitType()),
      ];

      this.positionContent(1, undefined);
    }
  }

  roll() {
    this.contents.forEach((content) => content.delete());
    this.generateGoods();
  }
}
