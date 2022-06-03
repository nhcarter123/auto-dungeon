import Phaser from "phaser";
import { EImageKey, EUnitType, IImageData, TUnitOverrides, Unit } from "./unit";
import { EEventSpeed } from "../../../scenes/battle";
import { calculateDuration } from "../../../helpers/math";
import { Battlefield } from "../../fields/battlefield";
import { EEventType, IRangedEvent } from "../../../events/event";

export class Spider extends Unit {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    overrides?: TUnitOverrides
  ) {
    const imageData: IImageData = {
      key: EImageKey.Spider,
      scale: 0.4,
      startingDir: 1,
    };

    const defaults: TUnitOverrides = {
      attack: 2,
      health: 2,
    };

    super(add, EUnitType.Spider, imageData, {
      ...defaults,
      ...(overrides || {}),
    });
  }

  getDescription(): string {
    return `Unit to the right attacks: Do ${this.getRangedAttackAmount()} damage to a random enemy`;
  }

  getRangedAttackAmount(): number {
    return 2 * (this.getLevel() - 1) + 1;
  }

  createBeforeUnitInFrontAttacksEvent(
    myField: Battlefield,
    opponentsField: Battlefield
  ): IRangedEvent {
    const enemyField = myField.contains(this.id) ? opponentsField : myField;

    return {
      type: EEventType.Ranged,
      attackAmount: this.getRangedAttackAmount(),
      sourceId: this.id,
      duration: calculateDuration(EEventSpeed.Medium),
      affectedUnitIds: [enemyField.getRandomContent().id],
      perishedUnitIds: [],
    };
  }
}
