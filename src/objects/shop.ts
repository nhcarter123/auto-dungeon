import { Unit, getRandomUnitType } from "./unit";
import { lerp } from "../utils";
import Phaser from "phaser";
import { Item } from "./item";

export type Good = Unit | Item;

export class Shop {
  public goods: Good[];
  public size: number;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  readonly leftBorder: number;
  readonly rightBorder: number;
  readonly topBorder: number;
  readonly bottomBorder: number;
  public hoveredUnitId: string;
  private add: Phaser.GameObjects.GameObjectFactory | undefined;

  constructor(x: number, y: number, width: number) {
    this.goods = [];
    this.size = 5;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 225;
    this.leftBorder = this.x - this.width / 2;
    this.rightBorder = this.x + this.width / 2;
    this.topBorder = this.y - this.height / 2;
    this.bottomBorder = this.y + this.height / 2;
    this.hoveredUnitId = "";
  }

  create(add: Phaser.GameObjects.GameObjectFactory) {
    this.add = add;

    const rectangle = this.add.rectangle(
      this.x,
      this.y,
      this.width,
      this.height,
      0xbaffe5,
      0.5
    );

    rectangle.depth = -1;

    this.generateGoods();
  }

  generateGoods() {
    if (this.add) {
      this.goods = [
        new Unit(this.add, getRandomUnitType()),
        new Unit(this.add, getRandomUnitType()),
        new Unit(this.add, getRandomUnitType()),
        new Unit(this.add, getRandomUnitType()),
        new Unit(this.add, getRandomUnitType()),
      ];

      this.positionGoods(1, undefined);
    }
  }

  isMouseWithinBox(mouseX: number, mouseY: number): boolean {
    return (
      mouseX > this.leftBorder &&
      mouseX < this.rightBorder &&
      mouseY > this.topBorder &&
      mouseY < this.bottomBorder
    );
  }

  positionGoods(lerpSpeed: number, selectedId?: string) {
    const step = this.width / this.size;

    for (let i = 0; i < this.size; i++) {
      const unit = this.goods[i];

      if (unit && unit.id !== selectedId) {
        unit.gameObject.x = lerp(
          unit.gameObject.x,
          this.leftBorder + (i + 0.5) * step,
          lerpSpeed
        );
        unit.gameObject.y = lerp(
          unit.gameObject.y,
          this.y - unit.gameObject.displayHeight / 2 + 75,
          lerpSpeed
        );
      }
    }
  }

  hoverGoods(mouseX: number, mouseY: number): Good | undefined {
    const mouseWithinBox = this.isMouseWithinBox(mouseX, mouseY);

    if (mouseWithinBox) {
      const step = this.width / this.size;
      const targetIndex = Math.round((mouseX - this.leftBorder) / step - 0.5);

      return this.goods[targetIndex];
    }
  }

  scaleGoods() {
    this.goods.forEach((good) => {
      good.scale = Math.min(11 / (this.size + 5), 1);
      good.scaleMod = 1;
    });
  }

  roll() {
    this.goods.forEach((good) => good.delete());
    this.generateGoods();
  }

  removeGood(id: string) {
    this.goods = this.goods.filter((good) => good.id !== id);
  }

  contains(id: string) {
    return this.goods.some((good) => good.id === id);
  }
}
