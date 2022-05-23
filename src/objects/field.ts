import { MAX_XP, Unit } from "./unit";
import moment from "moment";
import { lerp } from "../utils";
import Phaser from "phaser";

export interface ReorderStatus {
  mergingUnit: Unit | undefined;
  targetIndex: number;
}

export class Field {
  public units: Unit[];
  public startX: number;
  public startY: number;
  public maxWidth: number;
  public width: number;
  public height: number;
  private leftBorder: number;
  private rightBorder: number;
  private topBorder: number;
  private bottomBorder: number;
  private gameObject: Phaser.GameObjects.Rectangle | undefined;
  public hoveredUnitId: string;
  public startedHoverTime: moment.Moment;

  constructor(x: number, y: number, maxWidth: number) {
    this.units = [];
    this.startX = x;
    this.startY = y;
    this.maxWidth = maxWidth;
    this.width = maxWidth;
    this.height = 225;
    this.leftBorder = this.startX - this.width / 2;
    this.rightBorder = this.startX + this.width / 2;
    this.topBorder = this.startY - this.height / 2;
    this.bottomBorder = this.startY + this.height / 2;
    this.hoveredUnitId = "";
    this.startedHoverTime = moment();
  }

  create(add: Phaser.GameObjects.GameObjectFactory) {
    this.positionUnits(1, undefined);
    this.setWidth();

    this.gameObject = add.rectangle(
      this.startX,
      this.startY,
      this.width,
      this.height,
      0xbaffe5,
      0.5
    );

    this.gameObject.depth = -1;
  }

  update() {
    this.setWidth();
  }

  isMouseWithinBox(mouseX: number, mouseY: number): boolean {
    return (
      mouseX > this.leftBorder &&
      mouseX < this.rightBorder &&
      mouseY > this.topBorder &&
      mouseY < this.bottomBorder
    );
  }

  positionUnits(lerpSpeed: number, selectedId?: string) {
    const totalUnits = this.units.length;
    const step = this.width / totalUnits;

    for (let i = 0; i < totalUnits; i++) {
      const unit = this.units[i];

      if (unit.id !== selectedId) {
        unit.gameObject.x = lerp(
          unit.gameObject.x,
          this.leftBorder + (i + 0.5) * step,
          lerpSpeed
        );
        unit.gameObject.y = lerp(
          unit.gameObject.y,
          this.startY - unit.gameObject.displayHeight / 2 + 75,
          lerpSpeed
        );
      }
    }
  }

  reorderField(
    mouseX: number,
    mouseY: number,
    selectedUnit: Unit
  ): ReorderStatus {
    let targetUnit: Unit | undefined;
    let targetIndex = -1;
    let mergable = false;
    let wantsToSwap = false;

    const mouseWithinBox = this.isMouseWithinBox(mouseX, mouseY);
    const currentIndex = this.units.findIndex(
      (unit) => unit.id === selectedUnit.id
    );

    if (mouseWithinBox && currentIndex > -1) {
      const totalUnits = this.units.length;
      const step = this.width / totalUnits;
      targetIndex = Math.round((mouseX - this.leftBorder) / step - 0.5);

      if (currentIndex !== targetIndex) {
        targetUnit = this.units[targetIndex];
        mergable = selectedUnit.isMergableWith(targetUnit);

        if (this.hoveredUnitId !== targetUnit.id) {
          this.hoveredUnitId = targetUnit.id;
          this.startedHoverTime = moment();
        }

        wantsToSwap = moment().diff(this.startedHoverTime, "seconds") >= 1;

        if (!mergable || wantsToSwap) {
          this.hoveredUnitId = "";
          this.swapUnits(currentIndex, targetIndex);
        }
      }
    } else {
      this.hoveredUnitId = "";
    }

    return {
      targetIndex,
      mergingUnit: mergable && !wantsToSwap ? targetUnit : undefined,
    };
  }

  hoverUnit(mouseX: number, mouseY: number): Unit | undefined {
    const mouseWithinBox = this.isMouseWithinBox(mouseX, mouseY);

    if (mouseWithinBox) {
      const totalUnits = this.units.length;
      const step = this.width / totalUnits;
      const targetIndex = Math.round((mouseX - this.leftBorder) / step - 0.5);

      return this.units[targetIndex];
    }
  }

  scaleUnits() {
    let totalUnits = this.units.length;

    this.units.forEach((unit) => {
      unit.scale = Math.min(11 / (totalUnits + 5), 1);
      unit.scaleMod = 1;
    });
  }

  swapUnits(fromIndex: number, toIndex: number) {
    const element = this.units[fromIndex];
    this.units.splice(fromIndex, 1);
    this.units.splice(toIndex, 0, element);
  }

  mergeUnits(baseUnit: Unit, mergingUnit: Unit) {
    baseUnit.xp = Math.min(baseUnit.xp + mergingUnit.xp, MAX_XP);
    baseUnit.attack = Math.max(baseUnit.attack, mergingUnit.attack) + 1;
    baseUnit.health = Math.max(baseUnit.health, mergingUnit.health) + 1;

    this.removeUnit(mergingUnit.id);
    mergingUnit.delete();
  }

  removeUnit(id: string) {
    this.units = this.units.filter((unit) => unit.id !== id);
  }

  setWidth() {
    const widthStep = 125;
    this.width = Math.min(this.units.length * widthStep, this.maxWidth);
    this.leftBorder = this.startX - this.width / 2;
    this.rightBorder = this.startX + this.width / 2;
    this.topBorder = this.startY - this.height / 2;
    this.bottomBorder = this.startY + this.height / 2;

    if (this.gameObject) {
      this.gameObject.x = this.startX - Math.max(this.width, widthStep) / 2;
      this.gameObject.width = Math.max(this.width, widthStep);
    }
  }
}
