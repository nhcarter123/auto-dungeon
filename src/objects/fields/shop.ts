import Phaser from "phaser";
import { Field } from "./field";
import { createUnitFromType, getRandomUnitType } from "../../helpers/unit";
import { Good } from "../good/good";
import { saveData } from "../../index";

export class Shop extends Field<Good> {
  public cost: number;
  private add: Phaser.GameObjects.GameObjectFactory | undefined;

  constructor(x: number, y: number, width: number) {
    super(x, y, width);
    this.cost = 1;
  }

  create(add: Phaser.GameObjects.GameObjectFactory) {
    super.create(add);

    this.add = add;
  }

  rollGoods() {
    if (this.add) {
      this.contents.forEach((content) => content.delete());

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
    if (saveData.gold >= this.cost) {
      saveData.gold -= this.cost;
      this.rollGoods();
    }
  }
}
