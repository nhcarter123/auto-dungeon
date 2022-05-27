import Phaser from "phaser";
import {
  EImageKey,
  EUnitType,
  getRandomUnitType,
  Unit,
} from "../objects/units/unit";
import { Battlefield } from "../objects/fields/battlefield";
import { EScene, screenHeight, screenWidth } from "../config";
import { Skeleton } from "../objects/units/skeleton";
import { Ogre } from "../objects/units/ogre";
import { Golem } from "../objects/units/golem";

const fastForward = 1;
const EVENT_DELAY = 60;

export enum EEventType {
  Fight = "Fight",
  Buff = "Buff",
}

export interface IEvent {
  type: EEventType;
  affectedUnits: Unit[];
  duration: number;
}

export const createUnitFromType = (
  add: Phaser.GameObjects.GameObjectFactory,
  type: EUnitType,
  flipX?: boolean
) => {
  switch (type) {
    case EUnitType.Skeleton:
      return new Skeleton(add, flipX);
    case EUnitType.Ogre:
      return new Ogre(add, flipX);
    case EUnitType.Golem:
      return new Golem(add, flipX);
  }
};

export default class Battle extends Phaser.Scene {
  private myField: Battlefield;
  private opponentsField: Battlefield;
  private eventQueue: IEvent[];
  private currentEvent: IEvent | undefined;
  private delayStep: number;
  private durationStep: number;

  constructor() {
    super(EScene.Battle);

    this.eventQueue = [];
    this.delayStep = 0;
    this.durationStep = 0;

    const halfScreenWidth = screenWidth / 2;
    const halfScreenHeight = screenHeight / 2;

    this.myField = new Battlefield(
      halfScreenWidth - halfScreenWidth / 2 - 25,
      halfScreenHeight,
      halfScreenWidth - 100,
      1
    );
    this.opponentsField = new Battlefield(
      halfScreenWidth + halfScreenWidth / 2 + 25,
      halfScreenHeight,
      halfScreenWidth - 100,
      -1
    );
  }

  preload() {
    this.load.image(EImageKey.RollButton, "assets/images/button_roll.png");
    this.load.image(EImageKey.SellButton, "assets/images/button_sell.png");
    this.load.image(EImageKey.NextButton, "assets/images/button_next.png");
    this.load.image(EImageKey.Swamp, "assets/images/background_swamp.png");
    this.load.image(EImageKey.Skeleton, "assets/images/skeleton.png");
    this.load.image(EImageKey.Ogre, "assets/images/ogre.png");
    this.load.image(EImageKey.Golem, "assets/images/golem.png");
    this.load.spritesheet(EImageKey.Level, "assets/sprites/level/texture.png", {
      frameWidth: 170,
      frameHeight: 124,
    });
  }

  create() {
    this.myField.create(this.add);
    this.opponentsField.create(this.add);

    const background = this.add.image(
      screenWidth / 2,
      screenHeight / 2,
      EImageKey.Swamp
    );
    background.depth = -10;

    this.myField.contents = [
      createUnitFromType(this.add, getRandomUnitType()),
      createUnitFromType(this.add, getRandomUnitType()),
      createUnitFromType(this.add, getRandomUnitType()),
      createUnitFromType(this.add, getRandomUnitType()),
      createUnitFromType(this.add, getRandomUnitType()),
    ];

    this.opponentsField.contents = [
      createUnitFromType(this.add, getRandomUnitType(), true),
      createUnitFromType(this.add, getRandomUnitType(), true),
      createUnitFromType(this.add, getRandomUnitType(), true),
      createUnitFromType(this.add, getRandomUnitType(), true),
      createUnitFromType(this.add, getRandomUnitType(), true),
      createUnitFromType(this.add, getRandomUnitType(), true),
      createUnitFromType(this.add, getRandomUnitType(), true),
    ];

    this.myField.positionContent(1);
    this.opponentsField.positionContent(1);
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    this.myField.contents.forEach((content) => content.update());
    this.opponentsField.contents.forEach((content) => content.update());

    this.myField.scaleContent();
    this.opponentsField.scaleContent();

    if (!this.myField.contents.length && !this.opponentsField.contents.length) {
      // console.log("Draw");
      return;
    }
    if (!this.myField.contents.length) {
      // console.log("I lost");
      return;
    }
    if (!this.opponentsField.contents.length) {
      // console.log("They lost");
      return;
    }

    // trigger battle-start events

    if (this.delayStep > EVENT_DELAY / fastForward) {
      if (!this.currentEvent) {
        // trigger pre-combat events

        // trigger fight events
        this.createFrontFightEvent();

        this.currentEvent = this.eventQueue.shift();
      }

      if (this.currentEvent) {
        if (this.durationStep > this.currentEvent.duration) {
          this.delayStep = 0;
          this.durationStep = 0;
        } else {
          this.performEvent();
          this.durationStep += 1;
        }
      }
    } else {
      // this leads to some problems.. can we run this always somehow?
      this.myField.positionContent(0.07 * fastForward);
      this.opponentsField.positionContent(0.07 * fastForward);
    }

    this.delayStep += 1;
  }

  createFrontFightEvent() {
    const myFirstUnit = this.myField.contents[0];
    const theirFirstUnit = this.opponentsField.contents[0];
    this.eventQueue.push({
      type: EEventType.Fight,
      affectedUnits: [myFirstUnit, theirFirstUnit],
      duration: 100 / fastForward,
    });
  }

  performEvent() {
    if (this.currentEvent) {
      const pct = this.durationStep / this.currentEvent.duration;
      const hitTime = Math.round(this.currentEvent.duration * 0.4);

      switch (this.currentEvent.type) {
        case EEventType.Fight:
          const leftUnit = this.currentEvent.affectedUnits[0];
          const rightUnit = this.currentEvent.affectedUnits[1];

          let doesLeftUnitSurvive,
            doesRightUnitSurvive = false;

          if (this.durationStep === hitTime) {
            leftUnit.health -= rightUnit.attack;
            rightUnit.health -= leftUnit.attack;
          }

          if (this.durationStep >= hitTime) {
            doesLeftUnitSurvive = leftUnit.health > 0;
            doesRightUnitSurvive = rightUnit.health > 0;
          } else {
            doesLeftUnitSurvive = leftUnit.health - rightUnit.attack > 0;
            doesRightUnitSurvive = rightUnit.health - leftUnit.attack > 0;
          }

          if (pct === 0) {
            leftUnit.startX = leftUnit.gameObject.x;
            leftUnit.startY = leftUnit.gameObject.y;
            rightUnit.startX = rightUnit.gameObject.x;
            rightUnit.startY = rightUnit.gameObject.y;
          }

          const fAngle1 = -0.4;
          const rot = rotateTowardAngle(0, 0.2, 0, fAngle1, pct);
          if (rot) {
            leftUnit.gameObject.rotation = rot;
            rightUnit.gameObject.rotation = -rot;
          }

          const fAngle2 = 0.7;
          const rot2 = rotateTowardAngle(0.3, 0.4, fAngle1, fAngle2, pct);
          if (rot2) {
            leftUnit.gameObject.rotation = rot2;
            rightUnit.gameObject.rotation = -rot2;
          }

          const rot3 = rotateTowardAngle(0.6, 0.8, fAngle2, 0, pct);
          const rot4 = rotateTowardAngle(0.4, 1, fAngle2, -8, pct);

          if (doesLeftUnitSurvive) {
            if (rot3) {
              leftUnit.gameObject.rotation = rot3;
            }
          } else if (rot4) {
            leftUnit.gameObject.rotation = rot4;
          }

          if (doesRightUnitSurvive) {
            if (rot3) {
              rightUnit.gameObject.rotation = -rot3;
            }
          } else if (rot4) {
            rightUnit.gameObject.rotation = -rot4;
          }

          const backupDist = -40;

          const movement1 = moveTowardsNumber(0, 0.3, 0, backupDist, pct);
          if (movement1) {
            leftUnit.gameObject.x = leftUnit.startX + movement1;
            rightUnit.gameObject.x = rightUnit.startX - movement1;
          }

          const moveDist = 150;
          const movement2 = moveTowardsNumber(
            0.3,
            0.4,
            backupDist,
            moveDist,
            pct
          );
          if (movement2) {
            leftUnit.gameObject.x = leftUnit.startX + movement2;
            rightUnit.gameObject.x = rightUnit.startX - movement2;
          }

          const startMove2 = 0.4;
          const finishMove2 = 0.65;

          if (pct >= startMove2 && pct <= finishMove2) {
            const movement =
              35 *
              Math.sin(
                Math.PI *
                  Math.pow((pct - startMove2) / (finishMove2 - startMove2), 0.7)
              );

            if (doesLeftUnitSurvive) {
              leftUnit.gameObject.x =
                leftUnit.startX + backupDist + moveDist - movement;
            }
            if (doesRightUnitSurvive) {
              rightUnit.gameObject.x =
                rightUnit.startX - backupDist - moveDist + movement;
            }
          }

          const startMove3 = 0.8;
          const finishMove3 = 1;

          if (pct >= startMove3 && pct <= finishMove3) {
            const movement =
              Math.sin(
                (Math.PI / 2) *
                  ((pct - startMove3) / (finishMove3 - startMove3))
              ) *
              (moveDist + backupDist);

            if (doesLeftUnitSurvive) {
              leftUnit.gameObject.x =
                leftUnit.startX + backupDist + moveDist - movement;
            }
            if (doesRightUnitSurvive) {
              rightUnit.gameObject.x =
                rightUnit.startX - backupDist - moveDist + movement;
            }
          }

          const movement3 = moveTowardsNumber(0.4, 1, 0, 1000, pct);
          if (!doesLeftUnitSurvive && movement3) {
            leftUnit.gameObject.x =
              leftUnit.startX + backupDist + moveDist - movement3;
            leftUnit.gameObject.y = leftUnit.startY - movement3 / 4;
          }
          if (!doesRightUnitSurvive && movement3) {
            rightUnit.gameObject.x =
              rightUnit.startX - backupDist - moveDist + movement3;
            rightUnit.gameObject.y = rightUnit.startY - movement3 / 4;
          }

          if (pct === 1) {
            if (!doesLeftUnitSurvive) {
              this.handleDeath(leftUnit, this.myField);
            }
            if (!doesRightUnitSurvive) {
              this.handleDeath(rightUnit, this.opponentsField);
            }

            this.currentEvent = undefined;
          }

          break;
        case EEventType.Buff:
          this.currentEvent.affectedUnits.forEach((unit) => {
            unit.attack += 1;
          });
          break;
        default:
          console.log(`Error unhandled event type: ${this.currentEvent.type}`);
      }
    }
  }

  handleDeath(unit: Unit, field: Battlefield) {
    const deathEvent = unit.createDeathEvent(this.myField, this.opponentsField);
    if (deathEvent) {
      this.eventQueue.push(deathEvent);
    }
    field.removeContent(unit.id);
    unit.delete();
  }
}

const rotateTowardAngle = (
  startRotation: number,
  finishRotation: number,
  startAngle: number,
  finishAngle: number,
  percentage: number
) => {
  if (percentage >= startRotation && percentage <= finishRotation) {
    return (
      (startAngle || 0) +
      ((finishAngle - startAngle) * (percentage - startRotation)) /
        (finishRotation - startRotation)
    );
  }
};

const moveTowardsNumber = (
  startMove: number,
  finishMove: number,
  start: number,
  finish: number,
  percentage: number
) => {
  if (percentage >= startMove && percentage <= finishMove) {
    return (
      start +
      ((percentage - startMove) / (finishMove - startMove)) * (finish - start)
    );
  }
};
