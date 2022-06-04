import Phaser from "phaser";
import { lerp } from "../../helpers/math";
import { Good } from "../good/good";

export class Field<ContentType extends Good> {
  public contents: ContentType[];
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public leftBorder: number;
  public rightBorder: number;
  public topBorder: number;
  public bottomBorder: number;
  public gameObject: Phaser.GameObjects.Rectangle | undefined;

  constructor(x: number, y: number, width: number) {
    this.contents = [];
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 225;
    this.leftBorder = this.x - this.width / 2;
    this.rightBorder = this.x + this.width / 2;
    this.topBorder = this.y - this.height / 2;
    this.bottomBorder = this.y + this.height / 2;
  }

  create(add: Phaser.GameObjects.GameObjectFactory) {
    this.gameObject = add.rectangle(
      this.x,
      this.y,
      this.width,
      this.height,
      0xbaffe5,
      0.25
    );

    this.gameObject.depth = -1;
  }

  isMouseWithinBox(mouseX: number, mouseY: number): boolean {
    return (
      mouseX > this.leftBorder &&
      mouseX < this.rightBorder &&
      mouseY > this.topBorder &&
      mouseY < this.bottomBorder
    );
  }

  positionContent(lerpSpeed: number, selectedId?: string) {
    const totalUnits = this.contents.length;
    const step = this.width / totalUnits;

    for (let i = 0; i < totalUnits; i++) {
      const unit = this.contents[i];

      if (unit.id !== selectedId) {
        unit.x = lerp(unit.x, this.leftBorder + (i + 0.5) * step, lerpSpeed);
        unit.y = lerp(
          unit.y,
          this.y - unit.gameObject.displayHeight / 2 + 75,
          lerpSpeed
        );
      }
    }
  }

  hoverContent(mouseX: number, mouseY: number): ContentType | undefined {
    const mouseWithinBox = this.isMouseWithinBox(mouseX, mouseY);

    if (mouseWithinBox) {
      const totalUnits = this.contents.length;
      const step = this.width / totalUnits;
      const targetIndex = Math.round((mouseX - this.leftBorder) / step - 0.5);

      return this.contents[targetIndex];
    }
  }

  scaleContent() {
    let totalUnits = this.contents.length;

    this.contents.forEach((content) => {
      content.scale = Math.min(11 / (totalUnits + 5), 1);
      content.scaleMod = 1;
    });
  }

  moveInArray(fromIndex: number, toIndex: number) {
    const element = this.contents[fromIndex];
    this.contents.splice(fromIndex, 1);
    this.contents.splice(toIndex, 0, element);
  }

  getRandomContent = (): ContentType => {
    return this.contents[Math.floor(Math.random() * this.contents.length)];
  };

  contains(id: string) {
    return this.contents.some((content) => content.id === id);
  }

  removeContent(id: string) {
    this.contents = this.contents.filter((content) => content.id !== id);
  }
}
