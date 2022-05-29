import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import {
  calculateDuration,
  EEventSpeed,
  EEventType,
  TShopEvent,
} from "../../scenes/battle";
import { PlanningField } from "../fields/planningField";

export class Ogre extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Ogre,
      path: "assets/images/ogre.png",
      scale: 0.35,
      startingDir: -1,
    };

    const defaults: TUnitOverrides = {
      attack: 1,
      health: 3,
    };

    super(add, EUnitType.Ogre, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  createEndTurnEvent(field: PlanningField): TShopEvent | undefined {
    const index = field.contents.findIndex((content) => content.id === this.id);

    if (index < field.contents.length - 1) {
      return {
        type: EEventType.Buff,
        attackAmount: 0,
        healthAmount: 1,
        sourceUnitId: this.id,
        duration: calculateDuration(EEventSpeed.Medium),
        affectedUnitIds: [field.contents[index + 1].id],
      };
    }
  }
}
