import Phaser from "phaser";
import { find } from "lodash";
import { moveTowards } from "../helpers/animation";
import { Battlefield } from "../objects/fields/battlefield";
import { IRangedEvent, TTimelineEvent } from "../events/event";
import { BaseAnim } from "../objects/animation/baseAnim";
import { BuffAnim } from "../objects/animation/buffAnim";
import { DamageNumberAnim } from "../objects/animation/damageNumberAnim";

export const animateRanged = (
  e: TTimelineEvent<IRangedEvent>,
  myField: Battlefield,
  opponentsField: Battlefield,
  animationObjects: BaseAnim[],
  add: Phaser.GameObjects.GameObjectFactory,
  step: number
): BaseAnim[] => {
  const baseUnits = [...e.myUnits, ...e.opponentsUnits];

  const pct = step / e.duration;
  const units = [...myField.contents, ...opponentsField.contents];

  const sourceId = e.sourceId;
  const sourceUnit = find(units, (content) => sourceId === content.id);

  if (sourceUnit) {
    const affectedUnits = e.affectedUnitIds
      .map((id) => find(units, (content) => id === content.id))
      .flatMap((v) => (v ? [v] : []));

    const totalUnits = affectedUnits.length;

    for (let i = 0; i < totalUnits; i++) {
      const unit = affectedUnits[i];
      const baseUnit = baseUnits.find((baseUnit) => baseUnit.id === unit.id);
      const start = (i / (totalUnits + 1)) * 0.5;
      const finish = ((i + 2) / (totalUnits + 1)) * 0.5;

      const scaledPct = (pct - start) / (finish - start);

      const xPos = moveTowards(start, finish, sourceUnit.x, unit.x, pct);
      const yPos = sourceUnit.y - 60 * Math.sin(Math.PI * scaledPct); //- 25 + scaledPct * 25;

      let attackObject = animationObjects.find(
        (animObject) => animObject.id === unit.id
      );

      if (xPos) {
        if (!attackObject) {
          attackObject = new BuffAnim(unit.id, unit.x, unit.y, add);
          animationObjects.push(attackObject);
        }

        attackObject.x = xPos;
        attackObject.y = yPos;
      }

      let damageNumber = animationObjects.find(
        (animObject) => animObject.id === `damageNumber:${unit.id}`
      );

      if (pct >= finish) {
        unit.health =
          (baseUnit?.health || 0) - unit.calculateDamage(e.attackAmount);

        // knock-back
        if (unit.health <= 0) {
          const dir = myField.contains(unit.id) ? -1 : 1;
          unit.animX = dir * (pct - finish) * 1800;
          unit.animY = -(pct - finish) * 400;
          unit.gameObject.rotation = (pct - finish) * 20;
        }

        if (!damageNumber) {
          const damageNumber = new DamageNumberAnim(
            `damageNumber:${unit.id}`,
            unit.x,
            unit.y + unit.gameObject.displayHeight / 2,
            unit.calculateDamage(e.attackAmount),
            add
          );
          animationObjects.push(damageNumber);
        }
      } else {
        unit.health = baseUnit?.health || 0;

        if (damageNumber) {
          damageNumber.destroy();
          animationObjects = animationObjects.filter(
            (animObject) => animObject.id !== `damageNumber:${unit.id}`
          );
        }
      }

      if (!xPos && attackObject) {
        attackObject.destroy();
        animationObjects = animationObjects.filter(
          (animObject) => animObject.id !== unit.id
        );
      }
    }

    if (pct === 1) {
      animationObjects.forEach((anim) => {
        anim.destroy();
      });
      animationObjects = [];
    }
  }

  animationObjects.forEach((anim) => anim.update(pct));

  return animationObjects;
};
