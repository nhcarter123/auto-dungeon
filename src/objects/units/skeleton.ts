import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import {
  calculateDuration,
  EEventSpeed,
  EEventType,
  TEvent,
} from "../../scenes/battle";
import { Battlefield } from "../fields/battlefield";

export class Skeleton extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Skeleton,
      path: "assets/images/skeleton.png",
      scale: 0.35,
      startingDir: 1,
    };

    const defaults: TUnitOverrides = {
      attack: 2,
      health: 1,
    };

    super(add, EUnitType.Skeleton, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  handleDeathEvent(field: Battlefield): TEvent | undefined {
    const index = field.contents.findIndex((content) => content.id === this.id);

    if (index > -1 && index + 1 < field.contents.length) {
      const unitToLeft = field.contents[index + 1];

      return {
        type: EEventType.Buff,
        affectedUnitIds: [unitToLeft.id],
        duration: calculateDuration(EEventSpeed.Fast),
        buffAmount: 3,
      };
    }
  }

  createDeathEvent(
    myField: Battlefield,
    opponentsField: Battlefield
  ): TEvent | undefined {
    const deathEvent = this.handleDeathEvent(myField);
    if (deathEvent) {
      return deathEvent;
    }

    return this.handleDeathEvent(opponentsField);
  }
}
