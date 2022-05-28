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

const fastForward = 1;
const EVENT_DELAY = 20;

export enum EEventSpeed {
  Slow = 140,
  Medium = 100,
  Fast = 60,
}

export enum EEventType {
  Fight = "Fight",
  Buff = "Buff",
  Result = "Result",
}

export enum EResult {
  Win = "Win",
  Loss = "Loss",
  Draw = "Draw",
}

interface IEvent {
  type: EEventType;
  affectedUnitIds: string[];
  duration: number;
}

interface IBuffEvent extends IEvent {
  type: EEventType.Buff;
  buffAmount: number;
  sourceUnitId: string;
}

interface IFightEvent extends IEvent {
  type: EEventType.Fight;
  doesLeftUnitSurvive: boolean;
  doesRightUnitSurvive: boolean;
}

interface IResultEvent extends IEvent {
  type: EEventType.Result;
  result: EResult;
}

export type TEvent = IFightEvent | IBuffEvent | IResultEvent;

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
  private paused: boolean;
  private buffObjects: Phaser.GameObjects.Arc[];

  constructor() {
    super(EScene.Battle);

    this.eventQueue = [];
    this.timeline = [];
    this.delayStep = 0;
    this.durationStep = 0;
    this.currentEventIndex = -1;
    this.buffObjects = [];
    this.paused = false;

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
      createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      // createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      // createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      // createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      // createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      // createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      // createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      // createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
    ];

    this.input.keyboard.on("keydown", (event: { keyCode: number }) => {
      switch (event.keyCode) {
        case Phaser.Input.Keyboard.KeyCodes.LEFT:
          if (this.currentEventIndex > 0) {
            this.currentEventIndex = this.currentEventIndex - 2;
            this.timelineEvent = undefined;
            this.delayStep = Infinity;
            this.durationStep = 0;
          }
          break;
        case Phaser.Input.Keyboard.KeyCodes.RIGHT:
          if (this.currentEventIndex < this.timeline.length - 1) {
            this.timelineEvent = undefined;
            this.delayStep = Infinity;
            this.durationStep = 0;
          }
          break;
        case Phaser.Input.Keyboard.KeyCodes.SPACE:
          this.paused = !this.paused;
          break;
      }
    });

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

    this.myField.positionContent(0.07 * fastForward);
    this.opponentsField.positionContent(0.07 * fastForward);

    if (!this.timelineEvent && this.currentEventIndex < this.timeline.length) {
      this.currentEventIndex += 1;
      this.timelineEvent = this.getCurrentEvent();
      if (this.timelineEvent) {
        this.syncField(this.myField, this.timelineEvent.myUnits);
        this.syncField(this.opponentsField, this.timelineEvent.opponentsUnits);
      }
    }

    if (this.paused || !this.timelineEvent) {
      return;
    }

    if (this.delayStep > EVENT_DELAY) {
      // if (this.durationStep === 0) {
      //   this.syncField(this.myField, this.timelineEvent.myUnits);
      //   this.syncField(this.opponentsField, this.timelineEvent.opponentsUnits);
      // }

      if (this.durationStep > this.timelineEvent.duration) {
        this.delayStep = 0;
        this.durationStep = 0;
        this.timelineEvent = undefined;
      } else {
        this.animateEvent();
        this.durationStep += 1;
      }
    }

    this.delayStep += 1;
  }

  getCurrentEvent(): TTimelineEvent | undefined {
    return this.timeline[this.currentEventIndex];
  }

  createFrontFightEvent() {
    const myFirstUnit = this.myField.contents[0];
    const theirFirstUnit = this.opponentsField.contents[0];

    if (myFirstUnit && theirFirstUnit) {
      this.eventQueue.push({
        type: EEventType.Fight,
        affectedUnitIds: [myFirstUnit.id, theirFirstUnit.id],
        duration: calculateDuration(EEventSpeed.Medium),
        doesLeftUnitSurvive: myFirstUnit.health - theirFirstUnit.attack > 0,
        doesRightUnitSurvive: theirFirstUnit.health - myFirstUnit.attack > 0,
      });
    }
  }

  createResultEvent() {
    let result = EResult.Draw;
    if (this.myField.contents.length) {
      result = EResult.Win;
    } else if (this.opponentsField.contents.length) {
      result = EResult.Loss;
    }

    this.eventQueue.push({
      type: EEventType.Result,
      affectedUnitIds: [],
      duration: calculateDuration(EEventSpeed.Medium),
      result: result,
    });
  }

  processEvent() {
    if (this.simulatedEvent) {
      switch (this.simulatedEvent.type) {
        case EEventType.Fight:
          const leftUnit = find(
            this.myField.contents,
            (content) => this.simulatedEvent?.affectedUnitIds[0] === content.id
          );
          const rightUnit = find(
            this.opponentsField.contents,
            (content) => this.simulatedEvent?.affectedUnitIds[1] === content.id
          );

          if (!leftUnit || !rightUnit) {
            console.log("Error: Unit is missing!");
            return;
          }

          leftUnit.health -= rightUnit.attack;
          rightUnit.health -= leftUnit.attack;

          if (leftUnit.health <= 0) {
            this.handleDeath(leftUnit, this.myField);
          }
          if (rightUnit.health <= 0) {
            this.handleDeath(rightUnit, this.opponentsField);
          }

          break;
        case EEventType.Buff:
          const sourceUnitId = this.simulatedEvent.sourceUnitId;
          const field = this.myField.contains(sourceUnitId)
            ? this.myField
            : this.opponentsField;

          const sourceUnit = find(
            field.contents,
            (content) => sourceUnitId === content.id
          );

          if (sourceUnit) {
            for (const id of this.simulatedEvent.affectedUnitIds) {
              const unit = find(
                field.contents,
                (content) =>
                  this.simulatedEvent?.affectedUnitIds[0] === content.id
              );

              if (unit) {
                unit.attack += this.simulatedEvent.buffAmount;
              }
            }

            field.removeContent(sourceUnitId);
            sourceUnit.delete();
          }
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
            (content) => this.timelineEvent?.affectedUnitIds[0] === content.id
          );
          const rightUnit = find(
            this.opponentsField.contents,
            (content) => this.timelineEvent?.affectedUnitIds[1] === content.id
          );

          if (!leftUnit || !rightUnit) {
            console.log("Error: Unit is missing!");
            return;
          }

          if (this.durationStep === hitTime) {
            leftUnit.health -= rightUnit.attack;
            rightUnit.health -= leftUnit.attack;
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

          const movement1 = moveTowards(0, 0.3, 0, backupDist, pct);
          if (movement1) {
            leftUnit.animX = movement1;
            rightUnit.animX = -movement1;
          }

          const moveDist = 150;
          const movement2 = moveTowards(0.3, 0.4, backupDist, moveDist, pct);
          if (movement2) {
            leftUnit.animX = movement2;
            rightUnit.animX = -movement2;
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
              leftUnit.animX = backupDist + moveDist - movement;
            }
            if (this.timelineEvent.doesRightUnitSurvive) {
              rightUnit.animX = -backupDist - moveDist + movement;
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
              leftUnit.animX = backupDist + moveDist - movement;
            }
            if (this.timelineEvent.doesRightUnitSurvive) {
              rightUnit.animX = -backupDist - moveDist + movement;
            }
          }

          const movement3 = moveTowards(0.4, 1, 0, 1400, pct);
          if (!this.timelineEvent.doesLeftUnitSurvive && movement3) {
            leftUnit.animX = backupDist + moveDist - movement3;
            leftUnit.animY = -movement3 / 4;
          }
          if (!this.timelineEvent.doesRightUnitSurvive && movement3) {
            rightUnit.animX = -backupDist - moveDist + movement3;
            rightUnit.animY = -movement3 / 4;
          }

          // if (pct === 1) {
          //   if (!this.timelineEvent.doesLeftUnitSurvive) {
          //     this.myField.removeContent(leftUnit.id);
          //     leftUnit.delete();
          //   }
          //   if (!this.timelineEvent.doesRightUnitSurvive) {
          //     this.opponentsField.removeContent(rightUnit.id);
          //     rightUnit.delete();
          //   }
          // }

          break;
        case EEventType.Buff:
          const sourceUnitId = this.timelineEvent.sourceUnitId;
          const sourceUnit = find(
            [...this.myField.contents, ...this.opponentsField.contents],
            (content) => sourceUnitId === content.id
          );

          if (sourceUnit) {
            const units = this.timelineEvent.affectedUnitIds
              .map((id) =>
                find(
                  [...this.myField.contents, ...this.opponentsField.contents],
                  (content) => id === content.id
                )
              )
              .flatMap((v) => (v ? [v] : []));

            if (!this.buffObjects.length) {
              units.forEach((unit) => {
                const buffObject = this.add.circle(
                  unit.x,
                  unit.y,
                  10,
                  0xd9d9d9
                );
                this.buffObjects.push(buffObject);
              });
            }

            for (let i = 0; i < units.length; i++) {
              const unit = units[i];
              const buffObject = this.buffObjects[i];

              const xPos = moveTowards(0, 1, sourceUnit.x, unit.x, pct);
              const yPos = sourceUnit.y - 60 * Math.sin(Math.PI * pct) - 40;

              if (xPos && yPos) {
                buffObject.x = xPos;
                buffObject.y = yPos;
              }
            }

            if (pct === 1) {
              this.clearBuffObjects();
            }

            // this.timelineEvent.affectedUnits.forEach((unit) => {
            //   unit.attack += 1;
            // });
          }
          break;
      }
    }
  }

  clearBuffObjects() {
    this.buffObjects.forEach((obj) => obj.destroy());
    this.buffObjects = [];
  }

  handleDeath(unit: Unit, field: Battlefield) {
    const deathEvent = unit.createDeathEvent(this.myField, this.opponentsField);
    if (deathEvent) {
      unit.visible = false;
      this.eventQueue.push(deathEvent);
    } else {
      field.removeContent(unit.id);
      unit.delete();
    }
  }

  syncField(field: Battlefield, targetUnits: TReducedUnitData[]) {
    const newUnits: Unit[] = [];

    if (this.timelineEvent) {
      for (let i = 0; i < targetUnits.length; i++) {
        const unit = targetUnits[i];
        const unitInField = find(
          field.contents,
          (content) => content.id === unit.id
        );

        if (unitInField) {
          unit.attack !== undefined && (unitInField.attack = unit.attack);
          unit.health !== undefined && (unitInField.health = unit.health);
          unit.visible !== undefined && (unitInField.visible = unit.visible);
          unitInField.gameObject.rotation = 0;
          unitInField.animX = 0;
          unitInField.animY = 0;
          // unit.x && (unitInField.x = unit.x);
          // unit.y && (unitInField.y = unit.y);
          newUnits.push(unitInField);
        } else if (unit.id) {
          console.log("created unit");

          newUnits.push(
            createUnitFromType(this.add, unit.type, {
              ...unit,
            })
          );
        }
      }
    }

    // Clean up existing units
    const unitsToRemove = field.contents.filter(
      (content) => !targetUnits.some((unit) => unit.id === content.id)
    );
    unitsToRemove.forEach((unit) => unit.delete());
    this.clearBuffObjects();

    field.contents = newUnits;
  }

  simulate() {
    const maxSteps = 1000;
    let index = 0;

    // todo disable rendering

    // trigger battle-start events

    while (index < maxSteps) {
      this.myField.positionContent(1);
      this.opponentsField.positionContent(1);

      this.simulatedEvent = this.eventQueue.pop();
      this.simulatedEvent &&
        this.timeline.push({
          ...this.simulatedEvent,
          myUnits: this.myField.contents.map(reduceUnit),
          opponentsUnits: this.opponentsField.contents.map(reduceUnit),
        });

      if (this.simulatedEvent?.type === EEventType.Result) {
        break;
      }

      this.processEvent();

      if (!this.eventQueue.length) {
        this.createFrontFightEvent();
        // trigger pre-combat events for all units

        if (!this.eventQueue.length) {
          this.createResultEvent();
        }
      }

      index += 1;
    }

    this.myField.contents.forEach((content) => content.delete());
    this.opponentsField.contents.forEach((content) => content.delete());
    this.myField.contents = [];
    this.opponentsField.contents = [];

    console.log(this.timeline);

    if (index === maxSteps) {
      console.log(`Error, did not reach finality in ${maxSteps} steps`);
    } else {
      console.log(`Done in ${index} steps`);
    }
  }
}

const reduceUnit = (unit: Unit): TReducedUnitData => {
  return pick(unit, [
    "id",
    "attack",
    "health",
    "facingDir",
    "type",
    "x",
    "y",
    "visible",
  ]);
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

const moveTowards = (
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
