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

const multi = 2;
const EVENT_DELAY = 60 / multi;
const EVENT_DURATION = 180 / multi;

export enum EEventType {
  Fight = "Fight",
}

export interface IEvent {
  type: EEventType;
  affectedUnits: Unit[];
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

    if (this.delayStep > EVENT_DELAY) {
      if (!this.currentEvent) {
        // trigger pre-combat events

        // trigger fight events
        this.createFrontFightEvent();

        this.currentEvent = this.eventQueue.shift();
      }

      if (this.durationStep > EVENT_DURATION) {
        this.delayStep = 0;
        this.durationStep = 0;
      } else {
        this.performEvent();
        this.durationStep += 1;
      }
    } else {
      // this leads to some problems.. can we run this always somehow?
      this.myField.positionContent(0.07 * multi);
      this.opponentsField.positionContent(0.07 * multi);
    }

    this.delayStep += 1;
  }

  createFrontFightEvent() {
    const myFirstUnit = this.myField.contents[0];
    const theirFirstUnit = this.opponentsField.contents[0];
    this.eventQueue.push({
      type: EEventType.Fight,
      affectedUnits: [myFirstUnit, theirFirstUnit],
    });
  }

  performEvent() {
    if (this.currentEvent) {
      const percentage = this.durationStep / EVENT_DURATION;
      const hitTime = Math.round(EVENT_DURATION * 0.4);

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

          // console.log(doesLeftUnitSurvive);
          // console.log(doesRightUnitSurvive);

          if (percentage === 0) {
            leftUnit.startX = leftUnit.gameObject.x;
            leftUnit.startY = leftUnit.gameObject.y;
            rightUnit.startX = rightUnit.gameObject.x;
            rightUnit.startY = rightUnit.gameObject.y;
          }

          const startAngle = 0;
          const finishAngle = 0.2;
          const targetAngle = -0.4;
          if (percentage >= startAngle && percentage <= finishAngle) {
            const angleOffset =
              (targetAngle * (percentage - startAngle)) /
              (finishAngle - startAngle);

            leftUnit.gameObject.rotation = angleOffset;
            rightUnit.gameObject.rotation = -angleOffset;
          }

          const startAngle2 = 0.3;
          const finishAngle2 = 0.4;
          const targetAngle2 = 0.7;

          if (percentage >= startAngle2 && percentage <= finishAngle2) {
            const angleOffset =
              ((targetAngle2 - targetAngle) * (percentage - startAngle2)) /
              (finishAngle2 - startAngle2);

            leftUnit.gameObject.rotation = targetAngle + angleOffset;
            rightUnit.gameObject.rotation = -targetAngle - angleOffset;
          }

          const startAngle4 = 0.4;
          const finishAngle4 = 1;

          if (percentage >= startAngle4 && percentage <= finishAngle4) {
            const angleOffset =
              (14 * (targetAngle2 * (percentage - startAngle4))) /
              (finishAngle4 - startAngle4);

            if (!doesLeftUnitSurvive) {
              leftUnit.gameObject.rotation = targetAngle2 - angleOffset;
            }
            if (!doesRightUnitSurvive) {
              rightUnit.gameObject.rotation = -targetAngle2 + angleOffset;
            }
          }

          const startAngle3 = 0.6;
          const finishAngle3 = 0.8;
          const targetAngle3 = 0;

          if (percentage >= startAngle3 && percentage <= finishAngle3) {
            const angleOffset =
              ((targetAngle3 + targetAngle2) * (percentage - startAngle3)) /
              (finishAngle3 - startAngle3);

            if (doesLeftUnitSurvive) {
              leftUnit.gameObject.rotation = targetAngle2 - angleOffset;
            }
            if (doesRightUnitSurvive) {
              rightUnit.gameObject.rotation = -targetAngle2 + angleOffset;
            }
          }

          const startMove0 = 0;
          const finishMove0 = 0.3;
          const pullBackDist = -40;
          if (percentage >= startMove0 && percentage <= finishMove0) {
            const movement =
              ((percentage - startMove0) / (finishMove0 - startMove0)) *
              pullBackDist;

            leftUnit.gameObject.x = leftUnit.startX + movement;
            rightUnit.gameObject.x = rightUnit.startX - movement;
          }

          const startMove = 0.3;
          const finishMove = 0.4;
          const moveDist = 150;
          if (percentage >= startMove && percentage <= finishMove) {
            const movement =
              pullBackDist +
              ((percentage - startMove) / (finishMove - startMove)) * moveDist;

            leftUnit.gameObject.x = leftUnit.startX + movement;
            rightUnit.gameObject.x = rightUnit.startX - movement;
          }

          const startMove2 = 0.4;
          const finishMove2 = 0.65;

          if (percentage >= startMove2 && percentage <= finishMove2) {
            const movement =
              35 *
              Math.sin(
                Math.PI *
                  Math.pow(
                    (percentage - startMove2) / (finishMove2 - startMove2),
                    0.7
                  )
              );

            if (doesLeftUnitSurvive) {
              leftUnit.gameObject.x =
                leftUnit.startX + pullBackDist + moveDist - movement;
            }
            if (doesRightUnitSurvive) {
              rightUnit.gameObject.x =
                rightUnit.startX - pullBackDist - moveDist + movement;
            }
          }

          const startMove3 = 0.8;
          const finishMove3 = 1;

          if (percentage >= startMove3 && percentage <= finishMove3) {
            const movement =
              Math.sin(
                (Math.PI / 2) *
                  ((percentage - startMove3) / (finishMove3 - startMove3))
              ) *
              (moveDist + pullBackDist);

            if (doesLeftUnitSurvive) {
              leftUnit.gameObject.x =
                leftUnit.startX + pullBackDist + moveDist - movement;
            }
            if (doesRightUnitSurvive) {
              rightUnit.gameObject.x =
                rightUnit.startX - pullBackDist - moveDist + movement;
            }
          }

          const startMove4 = 0.4;
          const finishMove4 = 1;

          if (percentage >= startMove4 && percentage <= finishMove4) {
            const movement =
              (1000 * (percentage - startMove4)) / (finishMove4 - startMove4);

            if (!doesLeftUnitSurvive) {
              leftUnit.gameObject.x =
                leftUnit.startX + pullBackDist + moveDist - movement;
              leftUnit.gameObject.y = leftUnit.startY - movement / 4;
            }
            if (!doesRightUnitSurvive) {
              rightUnit.gameObject.x =
                rightUnit.startX - pullBackDist - moveDist + movement;
              rightUnit.gameObject.y = rightUnit.startY - movement / 4;
            }
          }

          if (percentage === 1) {
            if (!doesLeftUnitSurvive) {
              this.myField.removeContent(leftUnit.id);
              leftUnit.delete();
            }
            if (!doesRightUnitSurvive) {
              this.opponentsField.removeContent(rightUnit.id);
              rightUnit.delete();
            }

            this.currentEvent = undefined;
          }

          // leftUnit.gameObject.x = screenWidth / 2 - percentage * 100;
          // rightUnit.gameObject.x = screenWidth / 2 + percentage * 100;
          break;
        default:
          console.log(`Error unhandled event type: ${this.currentEvent.type}`);
      }
    }
  }
}
