import Phaser from "phaser";
import { find } from "lodash";
import { IBuffEvent } from "../scenes/battle";
import { moveTowards } from "../helpers/animation";
import { Unit } from "../objects/good/units/unit";
import { IAnimation } from "./ranged";

export const animateBuff = (
  e: IBuffEvent,
  units: Unit[],
  animationObjects: IAnimation[],
  add: Phaser.GameObjects.GameObjectFactory,
  step: number
): IAnimation[] => {
  const pct = step / e.duration;

  const sourceId = e.sourceId;
  const sourceUnit = find(units, (content) => sourceId === content.id);

  if (sourceUnit) {
    const affectedUnits = e.affectedUnitIds
      .map((id) => find(units, (content) => id === content.id))
      .flatMap((v) => (v ? [v] : []));

    if (!animationObjects.length) {
      affectedUnits.forEach((unit) => {
        const animObject = {
          targetId: unit.id,
          gameObject: add.circle(unit.x, unit.y, 10, 0xd9d9d9),
        };
        animationObjects.push(animObject);
      });
    }

    for (let i = 0; i < affectedUnits.length; i++) {
      const unit = affectedUnits[i];
      const animObject = animationObjects[i];

      const xPos = moveTowards(0, 1, sourceUnit.x, unit.x, pct);
      const yPos = sourceUnit.y - 60 * Math.sin(Math.PI * pct) - 40;

      if (xPos && yPos) {
        animObject.gameObject.x = xPos;
        animObject.gameObject.y = yPos;
      }
    }

    if (pct === 1) {
      for (const id of e.affectedUnitIds) {
        const unit = find(
          units,
          (content) => e.affectedUnitIds[0] === content.id
        );

        // This is not good to do in the animation but it is needed for shop buff event.
        // Maybe we could find another place for this.
        if (unit) {
          unit.attack += e.attackAmount;
          unit.health += e.healthAmount;
        }
      }

      animationObjects.forEach((obj) => obj.gameObject.destroy());
      return [];
    }
  }

  return animationObjects;
};
