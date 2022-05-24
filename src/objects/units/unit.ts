import Phaser from "phaser";
import { nanoid } from "nanoid";
import { lerp } from "../../utils";

export const MAX_XP = 5;

export enum EUnitType {
  Skeleton = "Skeleton",
  Ogre = "Ogre",
  Golem = "Golem",
}

export interface IImageData {
  key: EImageKey;
  path: string;
  scale: number;
  startingDir: number;
}

export enum EImageKey {
  RollButton = "RollButton",
  SellButton = "SellButton",
  NextButton = "NextButton",
  Swamp = "Swamp",
  Skeleton = "Skeleton",
  Ogre = "Ogre",
  Golem = "Golem",
  Level = "Level",
}

export class Unit {
  public id: string;
  public startX: number;
  public startY: number;
  public attack: number;
  public health: number;
  public type: EUnitType;
  public facingDir: number;
  public imageData: IImageData;
  public gameObject: Phaser.GameObjects.Image;
  public attackObject: Phaser.GameObjects.Text;
  public attackObjectBackground: Phaser.GameObjects.Arc;
  public healthObject: Phaser.GameObjects.Text;
  public healthObjectBackground: Phaser.GameObjects.Arc;
  public levelObject: Phaser.GameObjects.Sprite;
  public xp: number;
  public depth: number;
  public scale: number;
  public scaleMod: number;

  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    type: EUnitType,
    attack: number,
    health: number,
    imageData: IImageData,
    flipX?: boolean
  ) {
    const numberSize = 24;

    this.id = nanoid();
    this.startX = 0;
    this.startY = 0;
    this.attack = attack;
    this.health = health;
    this.facingDir = flipX ? -1 : 1;
    this.imageData = imageData;
    this.type = type;
    this.xp = 1;
    this.depth = 0;
    this.scale = 1;
    this.scaleMod = 1;
    this.gameObject = add.image(this.startX, this.startY, this.imageData.key);
    this.gameObject.scale =
      this.scale * this.scaleMod * this.imageData.scale * 0.7;

    const fontStyle = {
      fontSize: "20px",
      fontFamily: "Verdana",
      strokeThickness: 1,
      align: "center",
      fixedWidth: numberSize,
      fixedHeight: numberSize,
    };

    this.gameObject.flipX = this.facingDir * this.imageData.startingDir > 0;
    this.attackObject = add.text(
      this.startX,
      this.startY,
      this.attack.toString(),
      fontStyle
    );
    this.healthObject = add.text(
      this.startX,
      this.startY,
      this.health.toString(),
      fontStyle
    );
    this.attackObjectBackground = add.circle(
      this.startX,
      this.startY,
      numberSize / 2 + 3,
      0x242424,
      1
    );
    this.healthObjectBackground = add.circle(
      this.startX,
      this.startY,
      numberSize / 2 + 3,
      0x242424,
      1
    );
    this.levelObject = add.sprite(this.startX, this.startY, EImageKey.Level);

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
    const scale = this.scale * this.scaleMod;
    const separation = 20 * scale;
    const leftX = this.gameObject.x - separation;
    const rightX = this.gameObject.x + separation;
    const positionY =
      this.gameObject.y + this.gameObject.displayHeight / 2 + 20;

    this.gameObject.depth = this.depth;

    this.attackObject.text = this.attack.toString();
    this.attackObject.x = leftX - this.healthObject.displayWidth / 2;
    this.attackObject.y = positionY - this.healthObject.displayHeight / 2;
    this.attackObject.scale = scale;
    this.attackObject.depth = this.depth + 2;

    this.healthObject.text = this.health.toString();
    this.healthObject.x = rightX - this.healthObject.displayWidth / 2;
    this.healthObject.y = positionY - this.healthObject.displayHeight / 2;
    this.healthObject.scale = scale;
    this.healthObject.depth = this.depth + 2;

    this.attackObjectBackground.x = leftX;
    this.attackObjectBackground.y = positionY;
    this.attackObjectBackground.scale = scale;
    this.attackObjectBackground.depth = this.depth + 1;

    this.healthObjectBackground.x = rightX;
    this.healthObjectBackground.y = positionY;
    this.healthObjectBackground.scale = scale;
    this.healthObjectBackground.depth = this.depth + 1;

    this.levelObject.x = this.gameObject.x;
    this.levelObject.y =
      this.gameObject.y - this.gameObject.displayHeight / 2 - 20;
    this.levelObject.scale = scale * 0.35;
    this.levelObject.depth = this.depth + 1;
    this.levelObject.setFrame(this.xp - 1);
  }

  isMergableWith(targetUnit: Unit): boolean {
    return (
      this.type === targetUnit.type &&
      this.xp < MAX_XP &&
      targetUnit.xp < MAX_XP
    );
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

export const getRandomUnitType = (): EUnitType => {
  const array = Object.values(EUnitType);
  return array[Math.floor(Math.random() * array.length)];
};