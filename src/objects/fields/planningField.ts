import moment from "moment";
import { Field } from "./field";
import { MAX_XP, Unit } from "../good/units/unit";

export interface ReorderStatus {
  mergingUnit: Unit | undefined;
  targetIndex: number;
}

export class PlanningField extends Field<Unit> {
  public maxWidth: number;
  public hoveredUnitId: string;
  public startedHoverTime: moment.Moment;

  constructor(x: number, y: number, width: number) {
    super(x, y, width);

    this.maxWidth = width;
    this.hoveredUnitId = "";
    this.startedHoverTime = moment();
  }

  update() {
    this.setWidth();
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
    const currentIndex = this.contents.findIndex(
      (content) => content.id === selectedUnit.id
    );

    if (mouseWithinBox && currentIndex > -1) {
      const totalUnits = this.contents.length;
      const step = this.width / totalUnits;
      targetIndex = Math.round((mouseX - this.leftBorder) / step - 0.5);

      if (currentIndex !== targetIndex) {
        targetUnit = this.contents[targetIndex];
        mergable = selectedUnit.isMergableWith(targetUnit);

        if (this.hoveredUnitId !== targetUnit.id) {
          this.hoveredUnitId = targetUnit.id;
          this.startedHoverTime = moment();
        }

        wantsToSwap = moment().diff(this.startedHoverTime, "seconds") >= 1;

        if (!mergable || wantsToSwap) {
          this.hoveredUnitId = "";
          this.moveInArray(currentIndex, targetIndex);
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

  mergeUnits(baseUnit: Unit, mergingUnit: Unit) {
    baseUnit.xp = Math.min(baseUnit.xp + mergingUnit.xp, MAX_XP);
    baseUnit.attack = Math.max(baseUnit.attack, mergingUnit.attack) + 1;
    baseUnit.health = Math.max(baseUnit.health, mergingUnit.health) + 1;

    this.removeContent(mergingUnit.id);
    mergingUnit.delete();
  }

  setWidth() {
    const widthStep = 125;
    this.width = Math.min(
      Math.max(this.contents.length, 1) * widthStep,
      this.maxWidth
    );
    this.leftBorder = this.x - this.width / 2;
    this.rightBorder = this.x + this.width / 2;
    this.topBorder = this.y - this.height / 2;
    this.bottomBorder = this.y + this.height / 2;

    if (this.gameObject) {
      this.gameObject.x = this.x + this.maxWidth / 2 - this.width / 2;
      this.gameObject.width = this.width;
    }
  }
}
