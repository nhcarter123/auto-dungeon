import { Unit } from "../units/unit";
import { Field } from "./field";
import { lerp } from "../../utils";

export class Battlefield extends Field<Unit> {
  private align: number;

  constructor(x: number, y: number, width: number, align: number) {
    super(x, y, width);

    this.align = align;
  }

  positionContent(lerpSpeed: number, selectedId?: string) {
    const totalUnits = this.contents.length;
    const step = this.width / Math.max(5, totalUnits);

    for (let i = 0; i < totalUnits; i++) {
      const unit = this.contents[i];
      const border = this.align === 1 ? this.rightBorder : this.leftBorder;

      unit.gameObject.x = lerp(
        unit.gameObject.x,
        border - (i + 0.5) * step * this.align,
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
