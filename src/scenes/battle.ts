import Phaser from "phaser";
import {
  EImageKey,
  EUnitType,
  getRandomUnitType,
  TUnitOverrides,
  Unit,
} from "../objects/units/unit";
import { Battlefield } from "../objects/fields/battlefield";
import { EScene, screenHeight, screenWidth } from "../config";
import { Skeleton } from "../objects/units/skeleton";
import { Ogre } from "../objects/units/ogre";
import { Golem } from "../objects/units/golem";
import { find, pick } from "lodash";

const fastForward = 0.5;
const EVENT_DELAY = 60;

export enum EEventSpeed {
  Slow = 140,
  Medium = 100,
  Fast = 60,
}

export enum EEventType {
  Fight = "Fight",
  Buff = "Buff",
}

export interface IEvent {
  type: EEventType;
  affectedUnits: Unit[];
  duration: number;
}

interface IFightEvent extends IEvent {
  type: EEventType.Fight;
  doesLeftUnitSurvive: boolean;
  doesRightUnitSurvive: boolean;
}

interface IBuffEvent extends IEvent {
  type: EEventType.Buff;
  buffAmount: number;
}

type TEvent = IFightEvent | IBuffEvent;

type TTimelineEvent = TEvent & {
  myUnits: TReducedUnitData[];
  opponentsUnits: TReducedUnitData[];
};

type TReducedUnitData = TUnitOverrides & Pick<Unit, "type">;

export const createUnitFromType = (
  add: Phaser.GameObjects.GameObjectFactory,
  type: EUnitType,
  overrides?: TUnitOverrides
) => {
  switch (type) {
    case EUnitType.Skeleton:
      return new Skeleton(add, overrides);
    case EUnitType.Ogre:
      return new Ogre(add, overrides);
    case EUnitType.Golem:
      return new Golem(add, overrides);
  }
};

export default class Battle extends Phaser.Scene {
  private myField: Battlefield;
  private opponentsField: Battlefield;
  private eventQueue: TEvent[];
  private simulatedEvent: TEvent | undefined;
  private timeline: TTimelineEvent[];
  private timelineEvent: TTimelineEvent | undefined;
  private currentEventIndex: number;
  private delayStep: number;
  private durationStep: number;

  constructor() {
    super(EScene.Battle);

    this.eventQueue = [];
    this.timeline = [];
    this.delayStep = 0;
    this.durationStep = 0;
    this.currentEventIndex = 0;

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
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
    ];

    this.myField.positionContent(1);
    this.opponentsField.positionContent(1);

    this.simulate();
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    this.myField.contents.forEach((content) => content.update());
    this.opponentsField.contents.forEach((content) => content.update());

    this.myField.scaleContent();
    this.opponentsField.scaleContent();

    if (this.delayStep > EVENT_DELAY) {
      this.timelineEvent = this.timeline[this.currentEventIndex];

      if (!this.timelineEvent) {
        console.log("done");
        return;
      }

      if (this.durationStep === 0) {
        this.syncField(this.myField, this.timelineEvent.myUnits);
        this.syncField(this.opponentsField, this.timelineEvent.opponentsUnits);
      }

      if (this.durationStep > this.timelineEvent.duration) {
        this.delayStep = 0;
        this.durationStep = 0;
        this.currentEventIndex += 1;
      } else {
        this.animateEvent();
        this.durationStep += 1;
      }
    } else {
      this.myField.positionContent(0.07 * fastForward);
      this.opponentsField.positionContent(0.07 * fastForward);
    }

    // this leads to some problems.. can we run this always somehow?
    // this.myField.positionContent(0.07 * fastForward);
    // this.opponentsField.positionContent(0.07 * fastForward);

    this.delayStep += 1;
  }

  createFrontFightEvent() {
    const myFirstUnit = this.myField.contents[0];
    const theirFirstUnit = this.opponentsField.contents[0];

    if (myFirstUnit && theirFirstUnit) {
      this.eventQueue.push({
        type: EEventType.Fight,
        affectedUnits: [myFirstUnit, theirFirstUnit],
        duration: calculateDuration(EEventSpeed.Medium),
        doesLeftUnitSurvive: myFirstUnit.health - theirFirstUnit.attack > 0,
        doesRightUnitSurvive: theirFirstUnit.health - myFirstUnit.attack > 0,
      });
    }
  }

  processEvent() {
    if (this.simulatedEvent) {
      switch (this.simulatedEvent.type) {
        case EEventType.Fight:
          const leftUnit = this.simulatedEvent.affectedUnits[0];
          const rightUnit = this.simulatedEvent.affectedUnits[1];

          leftUnit.health -= rightUnit.attack;
          rightUnit.health -= leftUnit.attack;

          if (leftUnit.health < 0) {
            this.handleDeath(leftUnit, this.myField);
          }
          if (rightUnit.health < 0) {
            this.handleDeath(rightUnit, this.opponentsField);
          }

          break;
        case EEventType.Buff:
          this.simulatedEvent.affectedUnits.forEach((unit) => {
            unit.attack += 1;
          });
          break;
      }
    }
  }

  animateEvent() {
    if (this.timelineEvent) {
      const pct = this.durationStep / this.timelineEvent.duration;
      const hitTime = Math.round(this.timelineEvent.duration * 0.4);

      switch (this.timelineEvent.type) {
        case EEventType.Fight:
          const leftUnit = find(
            this.myField.contents,
            (content) => this.timelineEvent?.affectedUnits[0].id === content.id
          );
          const rightUnit = find(
            this.opponentsField.contents,
            (content) => this.timelineEvent?.affectedUnits[1].id === content.id
          );

          if (!leftUnit || !rightUnit) {
            console.log("Error: Unit is missing!");
            return;
          }

          if (this.durationStep === hitTime) {
            leftUnit.health -= rightUnit.attack;
            rightUnit.health -= leftUnit.attack;
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

          if (this.timelineEvent.doesLeftUnitSurvive) {
            if (rot3) {
              leftUnit.gameObject.rotation = rot3;
            }
          } else if (rot4) {
            leftUnit.gameObject.rotation = rot4;
          }

          if (this.timelineEvent.doesRightUnitSurvive) {
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

            if (this.timelineEvent.doesLeftUnitSurvive) {
              leftUnit.gameObject.x =
                leftUnit.startX + backupDist + moveDist - movement;
            }
            if (this.timelineEvent.doesRightUnitSurvive) {
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

            if (this.timelineEvent.doesLeftUnitSurvive) {
              leftUnit.gameObject.x =
                leftUnit.startX + backupDist + moveDist - movement;
            }
            if (this.timelineEvent.doesRightUnitSurvive) {
              rightUnit.gameObject.x =
                rightUnit.startX - backupDist - moveDist + movement;
            }
          }

          const movement3 = moveTowardsNumber(0.4, 1, 0, 1000, pct);
          if (!this.timelineEvent.doesLeftUnitSurvive && movement3) {
            leftUnit.gameObject.x =
              leftUnit.startX + backupDist + moveDist - movement3;
            leftUnit.gameObject.y = leftUnit.startY - movement3 / 4;
          }
          if (!this.timelineEvent.doesRightUnitSurvive && movement3) {
            rightUnit.gameObject.x =
              rightUnit.startX - backupDist - moveDist + movement3;
            rightUnit.gameObject.y = rightUnit.startY - movement3 / 4;
          }

          break;
        case EEventType.Buff:
          this.timelineEvent.affectedUnits.forEach((unit) => {
            unit.attack += 1;
          });
          break;
      }
    }
  }

  handleDeath(unit: Unit, field: Battlefield) {
    const deathEvent = unit.createDeathEvent(this.myField, this.opponentsField);
    if (deathEvent) {
      // this.eventQueue.push(deathEvent);
    }
    field.removeContent(unit.id);
    unit.delete();
  }

  syncField(field: Battlefield, targetUnits: TReducedUnitData[]) {
    // console.log([...field.contents]);
    const newUnits: Unit[] = [];

    if (this.timelineEvent) {
      for (let i = 0; i < targetUnits.length; i++) {
        const unit = targetUnits[i];
        const unitInField = find(
          field.contents,
          (content) => content.id === unit.id
        );

        if (unitInField) {
          newUnits.push(unitInField);
        } else {
          console.log("created unit");
          newUnits.push(
            createUnitFromType(this.add, unit.type, {
              ...unit,
            })
          );
        }
      }
    }

    const unitsToRemove = field.contents.filter(
      (content) => !targetUnits.some((unit) => unit.id === content.id)
    );
    unitsToRemove.forEach((unit) => unit.delete());

    field.contents = newUnits;
    field.positionContent(1);
    // field.contents.length = targetUnits.length;

    // console.log(targetUnits);
    // console.log(field.contents);
  }

  simulate() {
    const maxSteps = 1000;
    let index = 0;

    // todo disable rendering

    // trigger battle-start events

    while (index === 0 || this.eventQueue.length > 0 || index > maxSteps) {
      if (
        !this.myField.contents.length &&
        !this.opponentsField.contents.length
      ) {
        console.log("Draw");
        break;
      }
      if (!this.myField.contents.length) {
        console.log("I lost");
        break;
      }
      if (!this.opponentsField.contents.length) {
        console.log("I won");
        break;
      }

      this.simulatedEvent = this.eventQueue.pop();
      this.simulatedEvent &&
        this.timeline.push({
          ...this.simulatedEvent,
          myUnits: this.myField.contents.map(reduceUnit),
          opponentsUnits: this.opponentsField.contents.map(reduceUnit),
        });
      this.processEvent();

      if (!this.eventQueue.length) {
        this.createFrontFightEvent();
        // trigger pre-combat events for all units
      }

      index += 1;
    }

    console.log(this.timeline);

    this.myField.contents.forEach((content) => content.delete());
    this.opponentsField.contents.forEach((content) => content.delete());
    this.myField.contents = [];
    this.opponentsField.contents = [];

    if (index > maxSteps) {
      console.log(`Error, did not reach finality`);
    } else {
      console.log(`Done in ${index} steps`);
    }
  }
}

const reduceUnit = (unit: Unit): TReducedUnitData => {
  return pick(unit, ["id", "attack", "health", "facingDir", "type"]);
};

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

export const calculateDuration = (speed: EEventSpeed) => {
  return Math.round(speed / fastForward);
};
