import { Unit } from "../unit";
import { Field } from "./field";

export class Battlefield extends Field<Unit> {
  constructor(x: number, y: number, maxWidth: number) {
    super(x, y, maxWidth);
  }
}
