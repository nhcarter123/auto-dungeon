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

const EVENT_DELAY = 100;
const EVENT_DURATION = 100;

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
  private step: number;

  constructor() {
    super(EScene.Battle);

    this.eventQueue = [];
    this.step = 0;

    const halfScreenWidth = screenWidth / 2;
    const halfScreenHeight = screenHeight / 2;

    this.myField = new Battlefield(
      halfScreenWidth - halfScreenWidth / 2,
      halfScreenHeight,
      halfScreenWidth - 50
    );
    this.opponentsField = new Battlefield(
      halfScreenWidth + halfScreenWidth / 2,
      halfScreenHeight,
      halfScreenWidth - 50
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
    ];
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    this.myField.contents.forEach((content) => content.update());
    this.opponentsField.contents.forEach((content) => content.update());

    this.myField.scaleContent();
    this.opponentsField.scaleContent();
    this.myField.positionContent(0.08);
    this.opponentsField.positionContent(0.08);

    // trigger battle-start events

    if (this.step > EVENT_DELAY) {
      this.step = 0;

      const firstEvent = this.eventQueue.shift();
      console.log(firstEvent);

      // do current event

      // trigger pre-combat events

      // trigger fight events
      this.createFrontFightEvent();
    }

    this.step += 1;
  }

  createFrontFightEvent() {
    const myFirstUnit = this.myField.contents[this.myField.contents.length - 1];
    const theirFirstUnit = this.opponentsField.contents[0];
    this.eventQueue.push({
      type: EEventType.Fight,
      affectedUnits: [myFirstUnit, theirFirstUnit],
    });
  }
}
