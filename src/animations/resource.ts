import Phaser from "phaser";
import { find } from "lodash";
import { moveTowards } from "../helpers/animation";
import { IResourceEvent } from "../events/event";
import { Unit } from "../objects/good/units/unit";
import { saveData } from "../index";

export interface IAnimation {
  gameObject: Phaser.GameObjects.Arc;
  id: string;
}

function oneDNoise(x: number): number {
  return Math.sin(2 * x) + Math.sin(Math.PI * x);
}

export const animateResource = (
  e: IResourceEvent,
  units: Unit[],
  animationObjects: IAnimation[],
  add: Phaser.GameObjects.GameObjectFactory,
  step: number
): IAnimation[] => {
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
          animObject = {
            gameObject: add.circle(sourceUnit.x, sourceUnit.y, 10, 0xd9d9d9),
            id: i.toString(),
          };

          animationObjects.push(animObject);
        }

        animObject.gameObject.x = xPos - 80 * oneDNoise(i) * sinMod;
        animObject.gameObject.y = yPos - 80 * oneDNoise(-i) * sinMod;
      }

      if ((!xPos || pct === finish) && animObject) {
        animObject.gameObject.destroy();
        animationObjects = animationObjects.filter(
          (animObject) => animObject.id !== i.toString()
        );
      }
    }
  }

  return animationObjects;
};
