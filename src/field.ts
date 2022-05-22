import { areUnitsMergable, Unit } from "./units";
import moment from "moment";
import { lerp, swapUnits } from "./scenes/Game";

export class Field {
  public units: Unit[];
  public startX: number;
  public startY: number;
  public width: number;
  public height: number;
  readonly leftBorder: number;
  readonly rightBorder: number;
  readonly topBorder: number;
  readonly bottomBorder: number;
  public hoveredUnitId: string;
  public startedHoverTime: moment.Moment;

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
    this.hoveredUnitId = "";
    this.startedHoverTime = moment();
  }

  isMouseWithinBox(mouseX: number, mouseY: number): boolean {
    return (
      mouseX > this.leftBorder &&
      mouseX < this.rightBorder &&
      mouseY > this.topBorder &&
      mouseY < this.bottomBorder
    );
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
    const mouseWithinBox = this.isMouseWithinBox(mouseX, mouseY);

    const filteredUnits = this.units.filter((unit) =>
      mouseWithinBox ? true : unit.id !== selectedId
    );

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
        unit.gameObject.y = lerp(
          unit.gameObject.y,
          this.bottomBorder - unit.gameObject.displayHeight / 2 - 15,
          0.1
        );
      }
    }
  }

  reorderField(mouseX: number, mouseY: number, selectedUnit: Unit) {
    const mouseWithinBox = this.isMouseWithinBox(mouseX, mouseY);

    const index = this.units.findIndex((unit) => unit.id === selectedUnit.id);

    if (mouseWithinBox && index > -1) {
      const totalUnits = this.units.length;
      const step = this.width / totalUnits;
      const targetIndex = Math.round((mouseX - this.leftBorder) / step - 0.5);

      if (index !== targetIndex) {
        const targetUnit = this.units[targetIndex];
        const mergable = areUnitsMergable(selectedUnit, targetUnit);

        if (this.hoveredUnitId !== targetUnit.id) {
          this.hoveredUnitId = targetUnit.id;
          this.startedHoverTime = moment();
        }

        const wantsToSwap =
          moment().diff(this.startedHoverTime, "seconds") >= 1;

        if (!mergable || wantsToSwap) {
          if (wantsToSwap) {
            this.startedHoverTime = moment();
          }

          this.units = swapUnits(this.units, index, targetIndex);
        }
      }
    }
  }

  hoverUnit(mouseX: number, mouseY: number): Unit | null {
    const mouseWithinBox = this.isMouseWithinBox(mouseX, mouseY);

    if (mouseWithinBox) {
      const totalUnits = this.units.length;
      const step = this.width / totalUnits;
      const targetIndex = Math.round((mouseX - this.leftBorder) / step - 0.5);

      return this.units[targetIndex];
    }

    return null;
  }

  scaleUnits(skipUnitId: string | undefined) {
    this.units.forEach((unit) => {
      if (
        unit.id !== skipUnitId &&
        unit.gameObject &&
        unit.gameObject.scale !== unit.imageData.scale
      ) {
        unit.scale = Math.min(10 / (this.units.length + 3), 1.25);
        unit.scaleMod = 1;
      }
    });
  }
}
