import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import { EEventSpeed } from "../../../scenes/battle";
import { calculateDuration } from "../../../helpers/math";
import { Battlefield } from "../../fields/battlefield";
import { EEventType, TBattleEvent } from "../../../events/event";

export class Lizard extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Lizard,
      scale: 0.4,
      startingDir: 1,
    };

    const defaults: TUnitOverrides = {
      attack: 1,
      health: 2,
    };

    super(add, EUnitType.Lizard, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  getDescription(): string {
    return `Death: Do ${this.getRangedAttackAmount()} damage to all units`;
  }

  getRangedAttackAmount(): number {
    return 2 * (this.getLevel() - 1) + 1;
  }

  createDeathEvent(
    myField: Battlefield,
    opponentsField: Battlefield
  ): TBattleEvent | undefined {
    const affectedUnitIds = [...myField.contents, ...opponentsField.contents]
      .filter((unit) => unit.visible)
      .map((content) => content.id)
      .filter((id) => id !== this.id);

    return {
      type: EEventType.Ranged,
      attackAmount: this.getRangedAttackAmount(),
      sourceId: this.id,
      duration: calculateDuration(EEventSpeed.Medium, affectedUnitIds.length),
      affectedUnitIds,
      perishedUnitIds: [],
    };
  }
}
