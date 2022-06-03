import Phaser from "phaser";
import { Battlefield } from "../../fields/battlefield";
import { PlanningField } from "../../fields/planningField";
import { lerp } from "../../../helpers/math";
import { Good, TGoodOverrides } from "../good";
import { TBattleEvent, TShopEvent } from "../../../events/event";

export const MAX_XP = 5;

export enum EUnitType {
  Skeleton = "Skeleton",
  Ogre = "Ogre",
  Golem = "Golem",
  Plant = "Plant",
  Spider = "Spider",
  Lizard = "Lizard",
  Orc = "Orc",
  OrcThief = "OrcThief",
}

export interface IImageData {
  key: EImageKey;
  scale: number;
  startingDir: number;
}

export enum ESpriteKey {
  Level = "Level",
}

export enum EImageKey {
  ButtonRoll = "ButtonRoll",
  ButtonSell = "ButtonSell",
  ButtonNext = "ButtonNext",
  BackgroundSwamp = "BackgroundSwamp",
  Skeleton = "Skeleton",
  Spider = "Spider",
  Lizard = "Lizard",
  Plant = "Plant",
  Ogre = "Ogre",
  Golem = "Golem",
  Gold = "Gold",
  Orc = "Orc",
  OrcThief = "OrcThief",
}

export type TUnitOverrides = TGoodOverrides &
  Partial<
    Pick<
      Unit,
      "attack" | "health" | "id" | "facingDir" | "x" | "y" | "visible" | "xp"
    >
  >;

export class Unit extends Good {
  public animX: number;
  public animY: number;
  public attack: number;
  public health: number;
  public attackObject: Phaser.GameObjects.Text;
  public attackObjectBackground: Phaser.GameObjects.Arc;
  public healthObject: Phaser.GameObjects.Text;
  public healthObjectBackground: Phaser.GameObjects.Arc;
  public levelObject: Phaser.GameObjects.Sprite;
  public xp: number;
  public visible: boolean;
  public beforeAttackOnCooldown: boolean;
  public didKillEnemy: boolean;
  public type: EUnitType;

  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    type: EUnitType,
    imageData: IImageData,
    overrides: TUnitOverrides
  ) {
    super(add, type, imageData, overrides);

    const numberSize = 24;
    this.animX = 0;
    this.animY = 0;
    this.attack = overrides.attack === undefined ? 1 : overrides.attack;
    this.health = overrides.health === undefined ? 1 : overrides.health;
    this.xp = overrides.xp === undefined ? 1 : overrides.xp;
    this.visible = overrides.visible === undefined ? true : overrides.visible;
    this.type = type;
    this.beforeAttackOnCooldown = false;
    this.didKillEnemy = false;

    const fontStyle = {
      fontSize: "20px",
      fontFamily: "Verdana",
      strokeThickness: 1,
      align: "center",
      fixedWidth: numberSize + 4,
      fixedHeight: numberSize + 4,
    };

    this.gameObject.flipX = this.facingDir * this.imageData.startingDir > 0;
    this.attackObject = add.text(
      this.x,
      this.y,
      this.attack.toString(),
      fontStyle
    );
    this.healthObject = add.text(
      this.x,
      this.y,
      this.health.toString(),
      fontStyle
    );
    this.attackObjectBackground = add.circle(
      this.x,
      this.y,
      numberSize / 2 + 3,
      0x242424,
      1
    );
    this.healthObjectBackground = add.circle(
      this.x,
      this.y,
      numberSize / 2 + 3,
      0x242424,
      1
    );
    this.levelObject = add.sprite(this.x, this.y, ESpriteKey.Level);

    this.draw();
  }

  update() {
    this.draw();

    this.gameObject.scale = lerp(
      this.gameObject.scale,
      this.scale * this.scaleMod * this.imageData.scale,
      0.2
    );
  }

  draw() {
    this.gameObject.x = this.x + this.animX;
    this.gameObject.y = this.y + this.animY;

    const scale = this.scale * this.scaleMod;
    const separation = 20 * scale;
    const leftX = this.gameObject.x - separation;
    const rightX = this.gameObject.x + separation;
    const positionY =
      this.gameObject.y + this.gameObject.displayHeight / 2 + 20;

    this.gameObject.depth = this.depth;
    this.gameObject.visible = this.visible;

    this.attackObject.text = this.attack.toString();
    this.attackObject.x = leftX - this.healthObject.displayWidth / 2;
    this.attackObject.y = positionY - this.healthObject.displayHeight / 2;
    this.attackObject.scale = scale;
    this.attackObject.depth = this.depth + 2;
    this.attackObject.visible = this.visible;

    this.healthObject.text = this.health.toString();
    this.healthObject.x = rightX - this.healthObject.displayWidth / 2;
    this.healthObject.y = positionY - this.healthObject.displayHeight / 2;
    this.healthObject.scale = scale;
    this.healthObject.depth = this.depth + 2;
    this.healthObject.visible = this.visible;

    this.attackObjectBackground.x = leftX;
    this.attackObjectBackground.y = positionY;
    this.attackObjectBackground.scale = scale;
    this.attackObjectBackground.depth = this.depth + 1;
    this.attackObjectBackground.visible = this.visible;

    this.healthObjectBackground.x = rightX;
    this.healthObjectBackground.y = positionY;
    this.healthObjectBackground.scale = scale;
    this.healthObjectBackground.depth = this.depth + 1;
    this.healthObjectBackground.visible = this.visible;

    this.levelObject.x = this.gameObject.x;
    this.levelObject.y =
      this.gameObject.y - this.gameObject.displayHeight / 2 - 20;
    this.levelObject.scale = scale * 0.35;
    this.levelObject.depth = this.depth + 1;
    this.levelObject.setFrame(this.xp - 1);
    this.levelObject.visible = this.visible;
  }

  getLevel(): number {
    return Math.floor(this.xp / 3) + 1;
  }

  isMergableWith(targetUnit: Unit): boolean {
    return (
      this.type === targetUnit.type &&
      this.xp < MAX_XP &&
      targetUnit.xp < MAX_XP
    );
  }

  createKillEvent(): TBattleEvent | undefined {
    return;
  }

  createDeathEvent(
    myField: Battlefield,
    opponentsField: Battlefield
  ): TBattleEvent | undefined {
    return;
  }

  createBeforeUnitInFrontAttacksEvent(
    myField: Battlefield,
    opponentsField: Battlefield
  ): TBattleEvent | undefined {
    return;
  }

  createEndTurnEvent(field: PlanningField): TShopEvent | undefined {
    return;
  }

  delete() {
    this.gameObject?.destroy();
    this.attackObject?.destroy();
    this.healthObject?.destroy();
    this.attackObjectBackground?.destroy();
    this.healthObjectBackground?.destroy();
    this.levelObject?.destroy();
  }
}
