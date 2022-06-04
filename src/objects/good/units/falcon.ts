import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import { EEventSpeed } from "../../../scenes/battle";
import { calculateDuration } from "../../../helpers/math";
import { Battlefield } from "../../fields/battlefield";
import { EEventType, IRangedEvent } from "../../../events/event";

export class Falcon extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Falcon,
      scale: 0.4,
      startingDir: 1,
    };

    const defaults: TUnitOverrides = {
      attack: 1,
      health: 1,
    };

    super(add, EUnitType.Falcon, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  getDescription(): string {
    return `Battle start: Do ${this.getRangedAttackAmount()} damage to the last enemy`;
  }

  getRangedAttackAmount(): number {
    return 4 * this.getLevel();
  }

  createBeforeBattleEvent(
    myField: Battlefield,
    opponentsField: Battlefield
  ): IRangedEvent {
    const enemyField = myField.contains(this.id) ? opponentsField : myField;

    return {
      type: EEventType.Ranged,
      attackAmount: this.getRangedAttackAmount(),
      sourceId: this.id,
      duration: calculateDuration(EEventSpeed.Medium),
      affectedUnitIds: [enemyField.contents[enemyField.contents.length - 1].id],
      perishedUnitIds: [],
    };
  }
}
