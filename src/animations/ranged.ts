import Phaser from "phaser";
import { find } from "lodash";
import { IRangedEvent } from "../scenes/battle";
import { moveTowards } from "../helpers/animation";
import { Unit } from "../objects/good/units/unit";

export const animateRanged = (
  e: IRangedEvent,
  units: Unit[],
  animationObjects: Phaser.GameObjects.Arc[],
  add: Phaser.GameObjects.GameObjectFactory,
  step: number
): Phaser.GameObjects.Arc[] => {
  const pct = step / e.duration;

  const sourceId = e.sourceId;
  const sourceUnit = find(units, (content) => sourceId === content.id);

  if (sourceUnit) {
    const affectedUnits = e.affectedUnitIds
      .map((id) => find(units, (content) => id === content.id))
      .flatMap((v) => (v ? [v] : []));

    if (!animationObjects.length) {
      affectedUnits.forEach((unit) => {
        const buffObject = add.circle(unit.x, unit.y, 10, 0xd9d9d9);
        animationObjects.push(buffObject);
      });
    }

    for (let i = 0; i < affectedUnits.length; i++) {
      const unit = affectedUnits[i];
      const buffObject = animationObjects[i];

      const xPos = moveTowards(0, 1, sourceUnit.x, unit.x, pct);
      const yPos = sourceUnit.y - 60 * Math.sin(Math.PI * pct) - 40;

      if (xPos && yPos) {
        buffObject.x = xPos;
        buffObject.y = yPos;
      }
    }

    if (pct === 1) {
      animationObjects.forEach((obj) => obj.destroy());
      return [];
    }
  }

  return animationObjects;
};
