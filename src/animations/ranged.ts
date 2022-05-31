import Phaser from "phaser";
import { find } from "lodash";
import { IRangedEvent, TTimelineEvent } from "../scenes/battle";
import { moveTowards } from "../helpers/animation";
import { Battlefield } from "../objects/fields/battlefield";

export interface IAnimation {
  gameObject: Phaser.GameObjects.Arc;
  targetId: string;
}

export const animateRanged = (
  e: TTimelineEvent<IRangedEvent>,
  myField: Battlefield,
  opponentsField: Battlefield,
  animationObjects: IAnimation[],
  add: Phaser.GameObjects.GameObjectFactory,
  step: number
): IAnimation[] => {
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
    const spacing = 0.6;
    const padding = 0.2;

    for (let i = 0; i < totalUnits; i++) {
      const unit = affectedUnits[i];
      const baseUnit = baseUnits.find((baseUnit) => baseUnit.id === unit.id);
      const start = spacing * (i / totalUnits);
      const finish = 1 - padding - spacing + start;

      const xPos = moveTowards(start, finish, sourceUnit.x, unit.x, pct);
      const yPos =
        sourceUnit.y -
        120 * Math.sin((Math.PI * (pct - start)) / (1 - padding - spacing)) -
        40;

      let animObject = animationObjects.find(
        (animObject) => animObject.targetId === unit.id
      );

      if (xPos) {
        if (!animObject) {
          animObject = {
            gameObject: add.circle(unit.x, unit.y, 10, 0xd9d9d9),
            targetId: unit.id,
          };

          animationObjects.push(animObject);
        }

        animObject.gameObject.x = xPos;
        animObject.gameObject.y = yPos;
      }

      if (pct >= finish) {
        unit.health = (baseUnit?.health || 0) - e.attackAmount;

        // knock-back
        if (unit.health <= 0) {
          const dir = myField.contains(unit.id) ? -1 : 1;
          unit.animX = dir * (pct - finish) * 2500;
          unit.animY = -(pct - finish) * 400;
          unit.gameObject.rotation = (pct - finish) * 20;
        }
      } else if (pct < finish) {
        unit.health = baseUnit?.health || 0;
      }

      if ((!xPos || pct === finish) && animObject) {
        console.log("destroyed");
        animObject.gameObject.destroy();
        animationObjects = animationObjects.filter(
          (animObject) => animObject.targetId !== unit.id
        );
      }
    }
  }

  return animationObjects;
};
