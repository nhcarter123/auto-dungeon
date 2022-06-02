import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import { EEventSpeed } from "../../../scenes/battle";
import { Battlefield } from "../../fields/battlefield";
import { calculateDuration } from "../../../helpers/math";
import { EEventType, TBattleEvent } from "../../../events/event";

export class Skeleton extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Skeleton,
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

  getDescription(): string {
    return `Death: Give the unit behind +${this.getAttackBuff()}/+0 until the end of battle`;
  }

  getAttackBuff(): number {
    return 4 * (this.getLevel() - 1) + 2;
  }

  handleDeathEvent(field: Battlefield): TBattleEvent | undefined {
    const index = field.contents.findIndex((content) => content.id === this.id);

    if (index > -1 && index + 1 < field.contents.length) {
      const unitToLeft = field.contents[index + 1];

      return {
        type: EEventType.Buff,
        affectedUnitIds: [unitToLeft.id],
        sourceId: this.id,
        duration: calculateDuration(EEventSpeed.Fast),
        attackAmount: this.getAttackBuff(),
        healthAmount: 0,
        perishedUnitIds: [],
        untilEndOfBattleOnly: true,
      };
    }
  }

  createDeathEvent(
    myField: Battlefield,
    opponentsField: Battlefield
  ): TBattleEvent | undefined {
    const deathEvent = this.handleDeathEvent(myField);
    if (deathEvent) {
      return deathEvent;
    }

    return this.handleDeathEvent(opponentsField);
  }
}
