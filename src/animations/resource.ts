import Phaser from "phaser";
import { find } from "lodash";
import { moveTowards } from "../helpers/animation";
import { IResourceEvent } from "../events/event";
import { Unit } from "../objects/good/units/unit";
import { saveData } from "../index";
import { BaseAnim } from "../objects/animation/baseAnim";
import { BuffAnim } from "../objects/animation/buffAnim";

function oneDNoise(x: number): number {
  return Math.sin(2 * x) + Math.sin(Math.PI * x);
}

export const animateResource = (
  e: IResourceEvent,
  units: Unit[],
  animationObjects: BaseAnim[],
  add: Phaser.GameObjects.GameObjectFactory,
  step: number
): BaseAnim[] => {
  const pct = step / e.duration;
  const sourceId = e.sourceId;
  const sourceUnit = find(units, (content) => sourceId === content.id);

  if (sourceUnit) {
    const amount = e.amount;

    saveData.gold = e.startAmount + Math.floor(pct * amount);

    for (let i = 0; i < amount; i++) {
      const start = i / (amount + 1);
      const finish = (i + 2) / (amount + 1);

      const sinMod = Math.sin(((pct - start) / (finish - start)) * Math.PI);
      const xPos = moveTowards(start, finish, sourceUnit.gameObject.x, 50, pct);
      const yPos = moveTowards(start, finish, sourceUnit.gameObject.y, 50, pct);

      let animObject = animationObjects.find(
        (animObject) => animObject.id === i.toString()
      );

      if (xPos && yPos) {
        if (!animObject) {
          animObject = new BuffAnim(
            i.toString(),
            sourceUnit.x,
            sourceUnit.y,
            add
          );
          animationObjects.push(animObject);
        }

        animObject.x = xPos - 80 * oneDNoise(i) * sinMod;
        animObject.y = yPos - 80 * oneDNoise(-i) * sinMod;
      }

      if ((!xPos || pct === finish) && animObject) {
        animObject.destroy();
        animationObjects = animationObjects.filter(
          (animObject) => animObject.id !== i.toString()
        );
      }
    }
  }

  animationObjects.forEach((anim) => anim.update());

  return animationObjects;
};
