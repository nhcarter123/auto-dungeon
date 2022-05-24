import { Unit, getRandomUnitType } from "../units/unit";
import Phaser from "phaser";
import { Item } from "../item";
import { Field } from "./field";
import { createUnitFromType } from "../../scenes/battle";

export type Good = Unit | Item;

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
