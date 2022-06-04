import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import { EEventType, TShopEvent } from "../../../events/event";
import { calculateDuration } from "../../../helpers/math";
import { EEventSpeed } from "../../../scenes/battle";

export class Golem extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Golem,
      scale: 0.2,
      startingDir: -1,
    };

    const defaults: TUnitOverrides = {
      attack: 1,
      health: 5,
    };

    super(add, EUnitType.Golem, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  createLevelUpEvent(): TShopEvent | undefined {
    return {
      type: EEventType.Buff,
      attackAmount: this.getStatGainAmount(),
      healthAmount: this.getStatGainAmount(),
      sourceId: this.id,
      duration: calculateDuration(EEventSpeed.Medium),
      affectedUnitIds: [this.id],
      perishedUnitIds: [],
      untilEndOfBattleOnly: false,
    };
  }

  getStatGainAmount(): number {
    return this.getLevel() * 2;
  }

  getDescription(): string {
    return `Level up: Gain +${this.getStatGainAmount()}/+${this.getStatGainAmount()}`;
  }
}
