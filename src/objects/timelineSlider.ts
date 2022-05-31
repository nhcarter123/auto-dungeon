import Phaser from "phaser";

export class TimelineSlider {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public sliderObject: Phaser.GameObjects.Rectangle;
  public sliderBackgroundObject: Phaser.GameObjects.Rectangle;

  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.sliderObject = add.rectangle(x, y, 20, height, 0xffffff, 1);
    this.sliderBackgroundObject = add.rectangle(
      x,
      y,
      width,
      height / 6,
      0xffffff,
      1
    );
  }

  update(pct: number, input: Phaser.Input.InputPlugin): number | undefined {
    const leftBorder = this.x - this.width / 2;
    const rightBorder = this.x + this.width / 2;
    const topBorder = this.y - this.height / 2;
    const bottomBorder = this.y + this.height / 2;

    this.sliderObject.x = leftBorder + pct * this.width;

    if (
      input.mousePointer.leftButtonDown() &&
      input.mousePointer.x > leftBorder &&
      input.mousePointer.x < rightBorder &&
      input.mousePointer.y > topBorder &&
      input.mousePointer.y < bottomBorder
    ) {
      return (input.mousePointer.x - leftBorder) / this.width;
    }
  }
}
