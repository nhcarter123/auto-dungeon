import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import { EEventSpeed, EEventType, IBuffEvent } from "../../../scenes/battle";
import { PlanningField } from "../../fields/planningField";
import { calculateDuration } from "../../../helpers/math";

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

  getDescription(): string {
    return `End of turn: Give the unit in front +0/+${this.getHealthBuff()}`;
  }

  getHealthBuff(): number {
    return this.getLevel();
  }

  createEndTurnEvent(field: PlanningField): IBuffEvent | undefined {
    const index = field.contents.findIndex((content) => content.id === this.id);

    if (index < field.contents.length - 1) {
      return {
        type: EEventType.Buff,
        attackAmount: 0,
        healthAmount: this.getHealthBuff(),
        sourceId: this.id,
        duration: calculateDuration(EEventSpeed.Fast),
        affectedUnitIds: [field.contents[index + 1].id],
        perishedUnitIds: [],
      };
    }
  }
}
