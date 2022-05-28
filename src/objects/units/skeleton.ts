import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import {
  calculateDuration,
  EEventSpeed,
  EEventType,
  IEvent,
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

  createDeathEvent(
    myField: Battlefield,
    opponentsField: Battlefield
  ): IEvent | undefined {
    const myIndex = myField.contents.findIndex(
      (content) => content.id === this.id
    );

    if (myIndex + 1 < myField.contents.length) {
      const unitToLeft = myField.contents[myIndex + 1];

      return {
        type: EEventType.Buff,
        affectedUnits: [unitToLeft],
        duration: calculateDuration(EEventSpeed.Medium),
      };
    }
  }
}
