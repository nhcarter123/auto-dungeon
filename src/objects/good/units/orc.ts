import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import { EEventType, TBattleEvent } from "../../../events/event";
import { calculateDuration } from "../../../helpers/math";
import { EEventSpeed } from "../../../scenes/battle";

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
      attack: 1,
      health: 3,
    };

    super(add, EUnitType.Orc, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  getDescription(): string {
    return `Hit enemy: Reduce enemy attack by ${this.getReductionAmount()}`;
  }

  getReductionAmount(): number {
    return 2 * this.getLevel();
  }

  createHitEnemyEvent(hitId: string): TBattleEvent | undefined {
    return {
      type: EEventType.Buff,
      attackAmount: -this.getReductionAmount(),
      healthAmount: 0,
      sourceId: this.id,
      duration: calculateDuration(EEventSpeed.Medium),
      affectedUnitIds: [hitId],
      perishedUnitIds: [],
      untilEndOfBattleOnly: true,
    };
  }
}
