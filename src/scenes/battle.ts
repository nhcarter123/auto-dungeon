import Phaser from "phaser";
import { Battlefield } from "../objects/fields/battlefield";
import { EScene, screenHeight, screenWidth } from "../config";
import { find } from "lodash";
import { animateFight } from "../animations/fight";
import { animateBuff } from "../animations/buff";
import { saveData } from "../index";
import {
  createUnitFromType,
  getRandomUnitType,
  reduceUnit,
  TReducedUnitData,
} from "../helpers/unit";
import { calculateDuration } from "../helpers/math";
import { EImageKey, Unit } from "../objects/good/units/unit";
import { animateRanged, IAnimation } from "../animations/ranged";
import { TimelineSlider } from "../objects/timelineSlider";

const EVENT_DELAY = 40;

export enum EEventSpeed {
  VerySlow = 280,
  Slow = 140,
  Medium = 100,
  Fast = 60,
}

export enum EEventType {
  Fight = "Fight",
  Buff = "Buff",
  Ranged = "Ranged",
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
  perishedUnitIds: string[];
}

export interface IBuffEvent extends IEvent {
  type: EEventType.Buff;
  attackAmount: number;
  healthAmount: number;
  sourceId: string;
  untilEndOfBattleOnly: boolean;
}

export interface IFightEvent extends IEvent {
  type: EEventType.Fight;
}

export interface IRangedEvent extends IEvent {
  type: EEventType.Ranged;
  attackAmount: number;
  sourceId: string;
}

interface IResultEvent extends IEvent {
  type: EEventType.Result;
  result: EResult;
}

export type TBattleEvent =
  | IFightEvent
  | IBuffEvent
  | IRangedEvent
  | IResultEvent;
export type TShopEvent = IBuffEvent;

export type TTimelineEvent<Type> = Type & {
  myUnits: TReducedUnitData[];
  opponentsUnits: TReducedUnitData[];
};

export default class Battle extends Phaser.Scene {
  private myField: Battlefield;
  private opponentsField: Battlefield;
  private eventQueue: TBattleEvent[];
  private simulatedEvent: TBattleEvent | undefined;
  private timeline: TTimelineEvent<TBattleEvent>[];
  private timelineEvent: TTimelineEvent<TBattleEvent> | undefined;
  private currentEventIndex: number;
  private targetEventIndex: number;
  private delayStep: number;
  private durationStep: number;
  private paused: boolean;
  private animationObjects: IAnimation[];
  private timelineSlider: TimelineSlider | undefined;
  private playSpeed: number;
  private happensOnce: boolean;

  constructor() {
    super(EScene.Battle);

    this.eventQueue = [];
    this.timeline = [];
    this.delayStep = 0;
    this.durationStep = 0;
    this.currentEventIndex = -1;
    this.targetEventIndex = -1;
    this.animationObjects = [];
    this.paused = false;
    this.happensOnce = false;
    this.playSpeed = 1;

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
    // TODO: improve this
    this.load.image(EImageKey.RollButton, "assets/images/button_roll.png");
    this.load.image(EImageKey.SellButton, "assets/images/button_sell.png");
    this.load.image(EImageKey.NextButton, "assets/images/button_next.png");
    this.load.image(EImageKey.Swamp, "assets/images/background_swamp.png");
    this.load.image(EImageKey.Skeleton, "assets/images/skeleton.png");
    this.load.image(EImageKey.Spider, "assets/images/spider.png");
    this.load.image(EImageKey.Ogre, "assets/images/ogre.png");
    this.load.image(EImageKey.Golem, "assets/images/golem.png");
    this.load.image(EImageKey.Plant, "assets/images/plant.png");
    this.load.image(EImageKey.Lizard, "assets/images/lizard.png");
    this.load.spritesheet(EImageKey.Level, "assets/sprites/level/texture.png", {
      frameWidth: 170,
      frameHeight: 124,
    });
  }

  create() {
    this.myField.create(this.add);
    this.opponentsField.create(this.add);

    this.timelineSlider = new TimelineSlider(
      this.add,
      screenWidth / 2,
      screenHeight - 100,
      900,
      90
    );

    const background = this.add.image(
      screenWidth / 2,
      screenHeight / 2,
      EImageKey.Swamp
    );
    background.depth = -10;

    this.input.keyboard.on("keydown", (event: { keyCode: number }) => {
      switch (event.keyCode) {
        case Phaser.Input.Keyboard.KeyCodes.LEFT:
          if (this.currentEventIndex > 0) {
            this.playSpeed = -1.5;
            this.paused = false;
            if (this.delayStep <= 0) {
              this.happensOnce = true;
            }
          }
          break;
        case Phaser.Input.Keyboard.KeyCodes.RIGHT:
          if (this.currentEventIndex < this.timeline.length) {
            this.playSpeed = 1.5;
            this.paused = false;
          }
          break;
        case Phaser.Input.Keyboard.KeyCodes.SPACE:
          this.paused = !this.paused;
          break;
      }
    });

    this.events.on("wake", () => this.setupBattle());
    this.setupBattle();
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    this.myField.contents.forEach((content) => content.update());
    this.opponentsField.contents.forEach((content) => content.update());

    this.myField.scaleContent();
    this.opponentsField.scaleContent();

    this.myField.positionContent(0.07 * saveData.fastForward);
    this.opponentsField.positionContent(0.07 * saveData.fastForward);

    if (!this.timelineEvent && this.currentEventIndex < this.timeline.length) {
      this.currentEventIndex += 1;
      this.timelineEvent = this.getCurrentEvent();
      if (this.timelineEvent) {
        if (this.delayStep < 0) {
          this.delayStep = EVENT_DELAY + 1;
          this.durationStep = this.timelineEvent.duration - 1;
        }

        this.syncField(this.myField, this.timelineEvent.myUnits);
        this.syncField(this.opponentsField, this.timelineEvent.opponentsUnits);
      } else {
        // const result = this.timeline[this.timeline.length - 1]
        this.goToShop();
      }
    }

    const stepPercentage =
      (Math.min(this.delayStep, EVENT_DELAY) + this.durationStep) /
      ((this.timelineEvent?.duration || Infinity) + EVENT_DELAY);

    if (this.targetEventIndex === this.currentEventIndex) {
      this.targetEventIndex = -1;
    }

    const pct =
      (this.currentEventIndex + stepPercentage) / this.timeline.length;
    // console.log(pct);

    const percent = this.timelineSlider?.update(pct, this.input);
    if (percent) {
      const rawIndex = this.timeline.length * percent;
      const oldCurrentEventIndex = this.currentEventIndex;
      this.currentEventIndex = Math.floor(rawIndex);
      this.timelineEvent = this.getCurrentEvent();

      this.paused = true;
      if (this.timelineEvent) {
        if (this.currentEventIndex !== oldCurrentEventIndex) {
          this.syncField(this.myField, this.timelineEvent.myUnits);
          this.syncField(
            this.opponentsField,
            this.timelineEvent.opponentsUnits
          );
        }

        const eventDuration = EVENT_DELAY + this.timelineEvent.duration;
        const step = (rawIndex - Math.floor(rawIndex)) * eventDuration;
        this.delayStep = step;
        this.durationStep = step > EVENT_DELAY ? step - EVENT_DELAY : 0;
      }
    }

    if (!this.timelineEvent) {
      return;
    }

    if (this.delayStep > EVENT_DELAY) {
      if (this.durationStep > this.timelineEvent.duration) {
        this.delayStep = 0;
        this.durationStep = 0;
        if (this.playSpeed > 1) {
          this.paused = true;
          this.playSpeed = 1;
        }
        this.timelineEvent = undefined;
      } else {
        this.animateEvent();
        this.durationStep += this.paused ? 0 : this.playSpeed;

        if (this.durationStep < 0) {
          this.delayStep = EVENT_DELAY;
        }
      }
    } else {
      this.delayStep += this.paused ? 0 : this.playSpeed;

      if (this.delayStep < 0) {
        if (this.happensOnce) {
          this.happensOnce = false;
          this.currentEventIndex -= 2;
          this.timelineEvent = undefined;
        } else {
          this.delayStep = 0;
          this.durationStep = 0;
          this.paused = true;
          this.playSpeed = 1;
        }
      }
    }
  }

  setupBattle() {
    this.currentEventIndex = -1;
    this.clearFields();

    this.myField.contents = [...saveData.units]
      .reverse()
      .map((unit) => createUnitFromType(this.add, unit.type, unit));

    const overrides = {
      facingDir: -1,
      attack: saveData.turn,
      health: saveData.turn,
    };
    for (let i = 0; i < Math.min(2 + saveData.turn, 5); i++) {
      this.opponentsField.contents.push(
        createUnitFromType(this.add, getRandomUnitType(), overrides)
      );
    }

    this.myField.positionContent(1);
    this.opponentsField.positionContent(1);

    this.simulate();
  }

  getCurrentEvent(): TTimelineEvent<TBattleEvent> | undefined {
    return this.timeline[this.currentEventIndex];
  }

  handleBeforeUnitInFrontAttacksEvent() {
    const mySecondUnit = this.myField.contents[1];
    const theirSecondUnit = this.opponentsField.contents[1];

    if (mySecondUnit && !mySecondUnit.beforeAttackOnCooldown) {
      mySecondUnit.beforeAttackOnCooldown = true;
      const event = mySecondUnit.createBeforeUnitInFrontAttacksEvent(
        this.myField,
        this.opponentsField
      );
      if (event) {
        return this.eventQueue.push(event);
      }
    }
    if (theirSecondUnit && !theirSecondUnit.beforeAttackOnCooldown) {
      theirSecondUnit.beforeAttackOnCooldown = true;
      const event = theirSecondUnit.createBeforeUnitInFrontAttacksEvent(
        this.myField,
        this.opponentsField
      );
      if (event) {
        return this.eventQueue.push(event);
      }
    }
  }

  handleFrontFightEvent() {
    const myFirstUnit = this.myField.contents[0];
    const theirFirstUnit = this.opponentsField.contents[0];
    const mySecondUnit = this.myField.contents[1];
    const theirSecondUnit = this.opponentsField.contents[1];

    this.eventQueue.push({
      type: EEventType.Fight,
      affectedUnitIds: [myFirstUnit.id, theirFirstUnit.id],
      duration: calculateDuration(EEventSpeed.Medium),
      perishedUnitIds: [],
    });

    mySecondUnit && (mySecondUnit.beforeAttackOnCooldown = false);
    theirSecondUnit && (theirSecondUnit.beforeAttackOnCooldown = false);
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
      perishedUnitIds: [],
    });
  }

  processEvent() {
    if (this.simulatedEvent) {
      // Be very careful with this as it is a copy an does not get updated
      const units = [...this.myField.contents, ...this.opponentsField.contents];

      switch (this.simulatedEvent.type) {
        case EEventType.Fight:
          const leftUnit = find(
            units,
            (content) => this.simulatedEvent?.affectedUnitIds[0] === content.id
          );
          const rightUnit = find(
            units,
            (content) => this.simulatedEvent?.affectedUnitIds[1] === content.id
          );

          if (!leftUnit || !rightUnit) {
            console.log(`Error: Unit is missing!`);
            return;
          }

          leftUnit.health -= rightUnit.attack;
          rightUnit.health -= leftUnit.attack;

          if (rightUnit.health <= 0) {
            leftUnit.didKillEnemy = true;
          }
          if (leftUnit.health <= 0) {
            rightUnit.didKillEnemy = true;
          }
          break;
        case EEventType.Buff: {
          const sourceId = this.simulatedEvent.sourceId;
          const attackAmount = this.simulatedEvent.attackAmount;
          const healthAmount = this.simulatedEvent.healthAmount;
          const sourceUnit = find(units, (content) => sourceId === content.id);

          if (sourceUnit) {
            for (const id of this.simulatedEvent.affectedUnitIds) {
              const unit = find(units, (content) => id === content.id);

              if (unit) {
                unit.attack += attackAmount;
                unit.health += healthAmount;
                if (!this.simulatedEvent.untilEndOfBattleOnly) {
                  saveData.units = saveData.units.map((unit) => {
                    if (unit.id === id) {
                      return {
                        ...unit,
                        attack: (unit.attack || 0) + attackAmount,
                        health: (unit.health || 0) + healthAmount,
                      };
                    } else {
                      return unit;
                    }
                  });
                }
              }
            }

            // Bit of an ugly edge case for
            if (!sourceUnit.visible) {
              this.myField.removeContent(sourceUnit.id);
              this.opponentsField.removeContent(sourceUnit.id);
              sourceUnit.delete();
            }
          }
          break;
        }
        case EEventType.Ranged: {
          const sourceId = this.simulatedEvent.sourceId;
          const sourceUnit = find(units, (content) => sourceId === content.id);

          if (sourceUnit) {
            for (const id of this.simulatedEvent.affectedUnitIds) {
              const unit = find(units, (content) => id === content.id);

              if (unit) {
                unit.health -= this.simulatedEvent.attackAmount;
              }
            }

            // Bit of an ugly edge case for
            if (!sourceUnit.visible) {
              this.myField.removeContent(sourceUnit.id);
              this.opponentsField.removeContent(sourceUnit.id);
              sourceUnit.delete();
            }
          }
          break;
        }
      }

      // handle death events
      for (const unit of [
        ...this.myField.contents,
        ...this.opponentsField.contents,
      ]) {
        if (unit.health <= 0) {
          this.simulatedEvent.perishedUnitIds.push(unit.id);
          this.handleDeath(unit);
        }
      }

      // handle kill events
      for (const unit of [
        ...this.myField.contents,
        ...this.opponentsField.contents,
      ]) {
        if (unit.didKillEnemy) {
          unit.didKillEnemy = false;
          const event = unit.createKillEvent();
          if (event) {
            this.eventQueue.push(event);
          }
        }
      }
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
            this.animationObjects,
            this.add,
            this.durationStep
          );
          break;
        case EEventType.Ranged:
          this.animationObjects = animateRanged(
            this.timelineEvent,
            this.myField,
            this.opponentsField,
            this.animationObjects,
            this.add,
            this.durationStep
          );
          break;
      }
    }
  }

  clearAnimationObjects() {
    this.animationObjects.forEach((obj) => {
      console.log("Animation object was not destroyed in animation");
      obj.gameObject.destroy();
    });
    this.animationObjects = [];
  }

  handleDeath(unit: Unit) {
    if (unit.visible) {
      const deathEvent = unit.createDeathEvent(
        this.myField,
        this.opponentsField
      );

      if (deathEvent) {
        unit.visible = false;
        this.eventQueue.push(deathEvent);
      } else {
        this.myField.removeContent(unit.id);
        this.opponentsField.removeContent(unit.id);
        unit.delete();
      }
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
          if (unit.attack !== undefined && unit.attack !== unitInField.attack) {
            console.log(`Animation did not match field during attack sync`);
            unitInField.attack = unit.attack;
          }
          if (unit.health !== undefined && unit.health !== unitInField.health) {
            console.log(`Animation did not match field during health sync`);
            unitInField.health = unit.health;
          }
          if (
            unit.visible !== undefined &&
            unit.visible !== unitInField.visible
          ) {
            console.log(`Animation did not match field during visible sync`);
            unitInField.visible = unit.visible;
          }
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
    this.clearAnimationObjects();

    field.contents = newUnits;
  }

  simulate() {
    this.timeline = [];
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
        if (
          !this.myField.contents.length ||
          !this.opponentsField.contents.length
        ) {
          this.createResultEvent();
        } else {
          if (!this.eventQueue.length) {
            this.handleBeforeUnitInFrontAttacksEvent();
          }

          if (!this.eventQueue.length) {
            this.handleFrontFightEvent();
          }

          // trigger pre-combat events for all units
        }
      }

      index += 1;
    }

    // console.log(this.timeline);

    this.clearFields();

    if (index === maxSteps) {
      console.log(`Error, did not reach finality in ${maxSteps} steps`);
    } else {
      console.log(`Done in ${index} steps`);
    }
  }

  clearFields() {
    this.myField.contents.forEach((content) => content.delete());
    this.opponentsField.contents.forEach((content) => content.delete());
    this.myField.contents = [];
    this.opponentsField.contents = [];
  }

  goToShop() {
    this.scene.switch(EScene.Planning);
  }
}
