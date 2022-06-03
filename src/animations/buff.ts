import Phaser from "phaser";
import { find } from "lodash";
import { moveTowards } from "../helpers/animation";
import { Unit } from "../objects/good/units/unit";
import { IBuffEvent } from "../events/event";
import { BaseAnim } from "../objects/animation/baseAnim";
import { BuffAnim } from "../objects/animation/buffAnim";

export const animateBuff = (
  e: IBuffEvent,
  units: Unit[],
  animationObjects: BaseAnim[],
  add: Phaser.GameObjects.GameObjectFactory,
  step: number
): BaseAnim[] => {
  const pct = step / e.duration;

  const sourceId = e.sourceId;
  const sourceUnit = find(units, (content) => sourceId === content.id);

  if (sourceUnit) {
    const affectedUnits = e.affectedUnitIds
      .map((id) => find(units, (content) => id === content.id))
      .flatMap((v) => (v ? [v] : []));

    if (!animationObjects.length) {
      affectedUnits.forEach((unit) => {
        const animObject = new BuffAnim(unit.id, unit.x, unit.y, add);
        animationObjects.push(animObject);
      });
    }

    for (let i = 0; i < affectedUnits.length; i++) {
      const unit = affectedUnits[i];
      const animObject = animationObjects[i];

      const xPos = moveTowards(0, 1, sourceUnit.x, unit.x, pct);
      const yPos = sourceUnit.y - 60 * Math.sin(Math.PI * pct) - 40;

      if (xPos && yPos) {
        animObject.x = xPos;
        animObject.y = yPos;
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

      animationObjects.forEach((obj) => obj.destroy());
      return [];
    }
  }

  animationObjects.forEach((anim) => anim.update());

  return animationObjects;
};
