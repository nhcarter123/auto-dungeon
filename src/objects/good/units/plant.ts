import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import { EEventSpeed, EEventType, TBattleEvent } from "../../../scenes/battle";
import { calculateDuration } from "../../../helpers/math";

export class Plant extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Plant,
      path: "assets/images/plant.png",
      scale: 0.4,
      startingDir: 1,
    };

    const defaults: TUnitOverrides = {
      attack: 1,
      health: 2,
    };

    super(add, EUnitType.Plant, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  getDescription(): string {
    return `Kill: Gain +${this.getBuffAmount()}/+0`;
  }

  getBuffAmount(): number {
    return 2 * (this.getLevel() - 1) + 1;
  }

  createKillEvent(): TBattleEvent | undefined {
    return {
      type: EEventType.Buff,
      attackAmount: this.getBuffAmount(),
      healthAmount: 0,
      sourceId: this.id,
      duration: calculateDuration(EEventSpeed.Fast),
      affectedUnitIds: [this.id],
      perishedUnitIds: [],
      untilEndOfBattleOnly: false,
    };
  }
}
