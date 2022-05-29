import { Field } from "./field";
import { lerp } from "../../helpers/math";
import { Unit } from "../good/units/unit";

export class Battlefield extends Field<Unit> {
  readonly align: number;

  constructor(x: number, y: number, width: number, align: number) {
    super(x, y, width);

    this.align = align;
  }

  positionContent(lerpSpeed: number) {
    const totalUnits = this.contents.length;
    const step = this.width / Math.max(5, totalUnits);

    for (let i = 0; i < totalUnits; i++) {
      const unit = this.contents[i];
      const border = this.align === 1 ? this.rightBorder : this.leftBorder;

      unit.x = lerp(unit.x, border - (i + 0.5) * step * this.align, lerpSpeed);
      unit.y = lerp(
        unit.y,
        this.y - unit.gameObject.displayHeight / 2 + 75,
        lerpSpeed
      );
    }
  }
}
