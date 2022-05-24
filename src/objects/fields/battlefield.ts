import { Unit } from "../units/unit";
import { Field } from "./field";

export class Battlefield extends Field<Unit> {
  constructor(x: number, y: number, width: number) {
    super(x, y, width);
  }
}
