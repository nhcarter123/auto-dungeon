import Phaser from "phaser";
import { createUnit, preloadUnitImages, Unit, UnitType } from "../units";
import { screenWidth } from "../config";

enum MouseEvent {
  PointerDown = "pointerdown",
  PointerUp = "pointerup",
}

const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end;

const swapUnits = (arr: Unit[], indexA: number, indexB: number): Unit[] => {
  const temp = arr[indexA];
  arr[indexA] = arr[indexB];
  arr[indexB] = temp;

  return arr;
};

class Field {
  public units: Unit[];
  public startX: number;
  public startY: number;
  public width: number;
  public height: number;
  readonly leftBorder: number;
  readonly rightBorder: number;
  readonly topBorder: number;
  readonly bottomBorder: number;

  constructor(x: number, width: number) {
    this.units = [];
    this.startX = x;
    this.startY = 400;
    this.width = width;
    this.height = 180;
    this.leftBorder = this.startX - this.width / 2;
    this.rightBorder = this.startX + this.width / 2;
    this.topBorder = this.startY - this.height / 2;
    this.bottomBorder = this.startY + this.height / 2;
  }

  positionUnits(
    lerpSpeed: number,
    selectedId?: string,
    mouseX?: number,
    mouseY?: number
  ) {
    if (!mouseX || !mouseY) {
      mouseX = 0;
      mouseY = 0;
    }
    const mouseWithinBox =
      mouseX > this.leftBorder &&
      mouseX < this.rightBorder &&
      mouseY > this.topBorder &&
      mouseY < this.bottomBorder;

    const filteredUnits = this.units.filter((unit) =>
      mouseWithinBox ? true : unit.id !== selectedId
    );
    // const filteredUnits = this.units.filter((unit) => unit);

    const totalUnits = filteredUnits.length;
    const step = this.width / totalUnits;

    for (let i = 0; i < totalUnits; i++) {
      const unit = filteredUnits[i];
      if (unit.gameObject && unit.id !== selectedId) {
        unit.gameObject.x = lerp(
          unit.gameObject.x,
          this.leftBorder + (i + 0.5) * step,
          lerpSpeed
        );
        unit.gameObject.y = lerp(unit.gameObject.y, this.startY, lerpSpeed);
      }
    }
  }

  reorderField(x: number, y: number, selectedUnit: Unit) {
    const filteredUnits = this.units.filter(
      (unit) => unit.id !== selectedUnit.id
    );
    const index = this.units.findIndex((unit) => unit.id === selectedUnit.id);

    if (index > -1) {
      const totalUnits = filteredUnits.length;
      const step = this.width / totalUnits;
      const targetIndex = Math.round((x - this.leftBorder) / step);

      if (x - this.leftBorder > 0 && this.rightBorder - x > 0) {
        if (index !== targetIndex) {
          this.units = swapUnits(this.units, index, targetIndex);
        }
      }
    }
  }
}

const showField = (field: Field, add: Phaser.GameObjects.GameObjectFactory) => {
  add.rectangle(
    field.startX,
    field.startY,
    field.width,
    field.height,
    0xfff,
    0.15
  );
};

export default class Demo extends Phaser.Scene {
  private units: Unit[];
  private myField: Field;
  private opponentsField: Field;
  private selected: Unit | null;
  private selectedOffsetX: number;
  private selectedOffsetY: number;

  constructor() {
    super("GameScene");

    this.units = [
      createUnit(UnitType.Skeleton),
      createUnit(UnitType.Skeleton),
      createUnit(UnitType.Skeleton),
      createUnit(UnitType.Skeleton),
      createUnit(UnitType.Skeleton),
    ];

    const halfScreenWidth = screenWidth / 2;

    this.myField = new Field(
      halfScreenWidth - halfScreenWidth / 2,
      halfScreenWidth - 250
    );
    this.opponentsField = new Field(
      halfScreenWidth + halfScreenWidth / 2,
      halfScreenWidth - 250
    );

    this.selected = null;
    this.selectedOffsetX = 0;
    this.selectedOffsetY = 0;
  }

  preload() {
    preloadUnitImages(this.units, this.load);
  }

  create() {
    this.units.map((unit) => {
      unit.gameObject = this.add
        .image(unit.startX, unit.startY, unit.imageData.key)
        .setInteractive();

      unit.gameObject.flipX = unit.flipX;
      unit.gameObject.scale = unit.imageData.scale;
      unit.gameObject.on(MouseEvent.PointerDown, () => {
        this.selected = unit;
        if (unit.gameObject) {
          this.selectedOffsetX = unit.gameObject.x - this.input.mousePointer.x;
          this.selectedOffsetY = unit.gameObject.y - this.input.mousePointer.y;
        }
      });
    });

    this.myField.units = this.units;
    this.myField.positionUnits(1, this.selected?.id);

    showField(this.myField, this.add);
    showField(this.opponentsField, this.add);

    this.input.on(MouseEvent.PointerUp, () => {
      this.selected = null;
    });
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    // this.units.map((unit) => {
    //   if (unit.gameObject) {
    //     // unit.gameObject.x += 0.1;
    //   }
    // });
    // console.log("test");

    if (this.selected) {
      const mouseX = this.input.mousePointer.x + this.selectedOffsetX;
      const mouseY = this.input.mousePointer.y + this.selectedOffsetY;

      if (this.selected.gameObject) {
        this.selected.gameObject.x = lerp(
          this.selected.gameObject.x,
          mouseX,
          0.12
        );
        this.selected.gameObject.y = lerp(
          this.selected.gameObject.y,
          mouseY,
          0.12
        );

        this.myField.reorderField(mouseX, mouseY, this.selected);
        this.myField.positionUnits(0.08, this.selected?.id, mouseX, mouseY);
      }
    } else {
      this.myField.positionUnits(0.08);
    }
  }
}
