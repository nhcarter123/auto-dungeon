import Phaser from "phaser";
import { MAX_XP, Unit, UnitType } from "../units";
import moment from "moment";
import { screenWidth } from "../config";
import { Field } from "../field";

enum MouseEvent {
  PointerDown = "pointerdown",
  PointerUp = "pointerup",
}

export const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end;

export const swapUnits = (
  arr: Unit[],
  fromIndex: number,
  toIndex: number
): Unit[] => {
  const element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
  return arr;
};

const showField = (field: Field, add: Phaser.GameObjects.GameObjectFactory) => {
  const rectangle = add.rectangle(
    field.startX,
    field.startY,
    field.width,
    field.height,
    0x242424,
    0.15
  );

  rectangle.depth = -1;
};

export default class Demo extends Phaser.Scene {
  private units: Unit[];
  private myField: Field;
  private opponentsField: Field;
  private selected: Unit | null;
  private selectedOffsetX: number;
  private selectedOffsetY: number;
  private mouseClicked: boolean;
  private mouseReleased: boolean;
  private mouseRightClicked: boolean;
  private mouseRightReleased: boolean;

  constructor() {
    super("GameScene");

    this.units = [
      new Unit(UnitType.Skeleton),
      new Unit(UnitType.Golem),
      new Unit(UnitType.Ogre),
      new Unit(UnitType.Ogre),
      new Unit(UnitType.Ogre),
      new Unit(UnitType.Skeleton),
      new Unit(UnitType.Golem),
      new Unit(UnitType.Skeleton),
      new Unit(UnitType.Skeleton),
    ];

    for (let i = 0; i < this.units.length; i++) {
      this.units[i].depth = i;
    }

    const halfScreenWidth = screenWidth / 2;

    this.myField = new Field(
      halfScreenWidth - halfScreenWidth / 2,
      halfScreenWidth - 50
    );
    this.opponentsField = new Field(
      halfScreenWidth + halfScreenWidth / 2,
      halfScreenWidth - 50
    );

    this.selected = null;
    this.selectedOffsetX = 0;
    this.selectedOffsetY = 0;
    this.mouseClicked = false;
    this.mouseReleased = false;
    this.mouseRightClicked = false;
    this.mouseRightReleased = false;
  }

  preload() {
    this.units.map((unit) => unit.preload(this.load));
  }

  create() {
    this.units.map((unit) => unit.create(this.add));

    this.myField.units = this.units;
    this.myField.positionUnits(1, this.selected?.id);

    showField(this.myField, this.add);
    showField(this.opponentsField, this.add);

    this.input.on(
      MouseEvent.PointerDown,
      (pointer: { rightButtonDown: () => any }) => {
        if (pointer.rightButtonDown()) {
          this.mouseRightClicked = true;
        } else {
          this.mouseClicked = true;
        }
      }
    );
    this.input.on(
      MouseEvent.PointerUp,
      (pointer: { rightButtonReleased: () => any }) => {
        if (pointer.rightButtonReleased()) {
          this.mouseRightReleased = true;
        } else {
          this.mouseReleased = true;
        }
      }
    );
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    this.units.forEach((unit) => unit.update());

    const mouseX = this.selected
      ? this.input.mousePointer.x + this.selectedOffsetX
      : this.input.mousePointer.x;
    const mouseY = this.selected
      ? this.input.mousePointer.y + this.selectedOffsetY
      : this.input.mousePointer.y;

    let unitToMerge: Unit | null = null;

    if (this.selected) {
      if (this.selected.gameObject) {
        this.selected.gameObject.x = lerp(
          this.selected.gameObject.x,
          mouseX,
          0.14
        );
        this.selected.gameObject.y = lerp(
          this.selected.gameObject.y,
          mouseY,
          0.14
        );

        unitToMerge = this.myField.reorderField(mouseX, mouseY, this.selected);
        this.myField.positionUnits(0.08, this.selected?.id, mouseX, mouseY);
      }
    } else {
      this.myField.positionUnits(0.08);
    }

    const hoveredUnit = this.myField.hoverUnit(mouseX, mouseY);

    if (hoveredUnit?.gameObject && hoveredUnit.id !== this.selected?.id) {
      hoveredUnit.scaleMod = 1.1;
    }

    if (this.mouseClicked) {
      this.mouseClicked = false;

      this.selected = hoveredUnit;

      if (
        hoveredUnit?.gameObject &&
        hoveredUnit.attackObject &&
        hoveredUnit.healthObject &&
        hoveredUnit.attackObjectBackground &&
        hoveredUnit.healthObjectBackground
      ) {
        hoveredUnit.gameObject.depth = 100;
        hoveredUnit.attackObject.depth = 102;
        hoveredUnit.healthObject.depth = 102;
        hoveredUnit.attackObjectBackground.depth = 101;
        hoveredUnit.healthObjectBackground.depth = 101;
        this.selectedOffsetX =
          hoveredUnit.gameObject.x - this.input.mousePointer.x;
        this.selectedOffsetY =
          hoveredUnit.gameObject.y - this.input.mousePointer.y;
      }
    }

    if (this.mouseRightClicked) {
      this.mouseRightClicked = false;

      if (hoveredUnit) {
        this.units = this.units.filter((unit) => unit.id !== hoveredUnit.id);
        this.myField.units = this.units;
        hoveredUnit.delete();
      }
    }

    if (this.mouseReleased) {
      this.mouseReleased = false;

      if (
        this.selected &&
        this.selected.gameObject &&
        this.selected.attackObject &&
        this.selected.healthObject &&
        this.selected.attackObjectBackground &&
        this.selected.healthObjectBackground
      ) {
        if (unitToMerge) {
          unitToMerge.xp = Math.min(unitToMerge.xp + this.selected.xp, MAX_XP);

          this.units = this.units.filter(
            (unit) => unit.id !== this.selected?.id
          );
          this.myField.units = this.units;
          this.selected.delete();
        } else {
          this.selected.gameObject.depth = this.selected.depth;
          this.selected.attackObject.depth = this.selected.depth + 2;
          this.selected.healthObject.depth = this.selected.depth + 2;
          this.selected.attackObjectBackground.depth = this.selected.depth + 1;
          this.selected.healthObjectBackground.depth = this.selected.depth + 1;
        }
      }
      this.myField.startedHoverTime = moment();
      this.myField.hoveredUnitId = "";
      this.selected = null;
    }

    this.myField.scaleUnits(
      this.selected?.id !== hoveredUnit?.id ? hoveredUnit?.id : undefined
    );
  }
}
