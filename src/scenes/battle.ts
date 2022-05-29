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
import { animateFight } from "../animations/fight";
import { animateBuff } from "../animations/buff";

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

export interface IBuffEvent extends IEvent {
  type: EEventType.Buff;
  attackAmount: number;
  healthAmount: number;
  sourceUnitId: string;
}

export interface IFightEvent extends IEvent {
  type: EEventType.Fight;
  doesLeftUnitSurvive: boolean;
  doesRightUnitSurvive: boolean;
}

interface IResultEvent extends IEvent {
  type: EEventType.Result;
  result: EResult;
}

export type TBattleEvent = IFightEvent | IBuffEvent | IResultEvent;
export type TShopEvent = IBuffEvent;

type TTimelineEvent = TBattleEvent & {
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
  private eventQueue: TBattleEvent[];
  private simulatedEvent: TBattleEvent | undefined;
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
      // createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      // createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      // createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      // createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      // createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      // createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      // createUnitFromType(this.add, EUnitType.Skeleton, { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
      createUnitFromType(this.add, getRandomUnitType(), { facingDir: -1 }),
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
                unit.attack += this.simulatedEvent.attackAmount;
                unit.health += this.simulatedEvent.healthAmount;
              }
            }

            if (!sourceUnit.visible) {
              field.removeContent(sourceUnitId);
              sourceUnit.delete();
            }
          }
          break;
      }

      // handle death events
      [...this.myField.contents, ...this.opponentsField.contents].forEach(
        (content) => {
          if (content.health <= 0) {
            this.handleDeath(content);
          }
        }
      );
    }
  }

  animateEvent() {
    if (this.timelineEvent) {
      switch (this.timelineEvent.type) {
        case EEventType.Fight:
          animateFight(
            this.timelineEvent,
            this.myField,
            this.opponentsField,
            this.durationStep
          );
          break;
        case EEventType.Buff:
          animateBuff(
            this.timelineEvent,
            [...this.myField.contents, ...this.opponentsField.contents],
            this.buffObjects,
            this.add,
            this.durationStep
          );
          break;
      }
    }
  }

  clearBuffObjects() {
    this.buffObjects.forEach((obj) => obj.destroy());
    this.buffObjects = [];
  }

  handleDeath(unit: Unit) {
    const deathEvent = unit.createDeathEvent(this.myField, this.opponentsField);
    if (deathEvent) {
      unit.visible = false;
      this.eventQueue.push(deathEvent);
    } else {
      this.myField.removeContent(unit.id);
      this.opponentsField.removeContent(unit.id);
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

export const calculateDuration = (speed: EEventSpeed) => {
  return Math.round(speed / fastForward);
};
