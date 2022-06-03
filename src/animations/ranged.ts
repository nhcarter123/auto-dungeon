import Phaser from "phaser";
import { find } from "lodash";
import { moveTowards } from "../helpers/animation";
import { Battlefield } from "../objects/fields/battlefield";
import { IRangedEvent, TTimelineEvent } from "../events/event";
import { BaseAnim } from "../objects/animation/baseAnim";
import { BuffAnim } from "../objects/animation/buffAnim";

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
      const start = (i / (totalUnits + 1)) * 0.75;
      const finish = ((i + 2) / (totalUnits + 1)) * 0.75;

      const xPos = moveTowards(start, finish, sourceUnit.x, unit.x, pct);
      const yPos =
        sourceUnit.y -
        120 * Math.sin((Math.PI * (pct - start)) / (finish - start)) -
        40;

      let animObject = animationObjects.find(
        (animObject) => animObject.id === unit.id
      );

      if (xPos) {
        if (!animObject) {
          animObject = new BuffAnim(unit.id, unit.x, unit.y, add);
          animationObjects.push(animObject);
        }

        animObject.x = xPos;
        animObject.y = yPos;
      }

      if (pct >= finish) {
        unit.health = (baseUnit?.health || 0) - e.attackAmount;

        // knock-back
        if (unit.health <= 0) {
          const dir = myField.contains(unit.id) ? -1 : 1;
          unit.animX = dir * (pct - finish) * 2200;
          unit.animY = -(pct - finish) * 400;
          unit.gameObject.rotation = (pct - finish) * 20;
        }
      } else if (pct < finish) {
        unit.health = baseUnit?.health || 0;
      }

      if ((!xPos || pct === finish) && animObject) {
        animObject.destroy();
        animationObjects = animationObjects.filter(
          (animObject) => animObject.id !== unit.id
        );
      }
    }
  }

  animationObjects.forEach((anim) => anim.update());

  return animationObjects;
};
