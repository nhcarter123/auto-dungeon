import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import { EEventSpeed } from "../../../scenes/battle";
import { calculateDuration } from "../../../helpers/math";
import { EEventType, EResource, TBattleEvent } from "../../../events/event";
import { saveData } from "../../../index";

export class Orc extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Orc,
      scale: 0.25,
      startingDir: -1,
    };

    const defaults: TUnitOverrides = {
      attack: 3,
      health: 2,
    };

    super(add, EUnitType.Orc, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  getDescription(): string {
    return `Kill: Gain ${this.getStealAmount()} gold`;
  }

  getStealAmount(): number {
    return 2 * (this.getLevel() - 1) + 1;
  }

  createKillEvent(): TBattleEvent | undefined {
    const amount = this.getStealAmount();

    return {
      type: EEventType.Resource,
      startAmount: saveData.gold,
      amount,
      sourceId: this.id,
      duration: calculateDuration(EEventSpeed.Medium, (amount + 4) / 5),
      resource: EResource.Gold,
      affectedUnitIds: [],
      perishedUnitIds: [],
    };
  }
}
