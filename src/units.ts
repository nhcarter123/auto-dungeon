import Phaser from "phaser";
import { nanoid } from "nanoid";
import { lerp } from "./scenes/Game";

export const MAX_XP = 6;

export enum UnitType {
  Skeleton = "Skeleton",
  Ogre = "Ogre",
  Golem = "Golem",
}

interface UnitDefaultData {
  attack: number;
  health: number;
  imageData: ImageData;
}

interface ImageData {
  key: string;
  path: string;
  scale: number;
  startingDir: number;
}

const levelImagePath = "assets/sprites/level.png";

enum EImageKey {
  Skeleton = "Skeleton",
  Ogre = "Ogre",
  Golem = "Golem",
  Level = "Level",
}

const getUnitDataFromType = (type: UnitType): UnitDefaultData => {
  switch (type) {
    case UnitType.Ogre:
      return {
        attack: 1,
        health: 2,
        imageData: {
          key: EImageKey.Ogre,
          path: "assets/images/ogre.png",
          scale: 0.35,
          startingDir: -1,
        },
      };
    case UnitType.Golem:
      return {
        attack: 1,
        health: 5,
        imageData: {
          key: EImageKey.Golem,
          path: "assets/images/golem.png",
          scale: 0.2,
          startingDir: -1,
        },
      };
    case UnitType.Skeleton:
    default:
      return {
        attack: 2,
        health: 1,
        imageData: {
          key: EImageKey.Skeleton,
          path: "assets/images/skeleton.png",
          scale: 0.35,
          startingDir: 1,
        },
      };
  }
};

export class Unit {
  public id: string;
  public startX: number;
  public startY: number;
  public attack: number;
  public health: number;
  public type: UnitType;
  public facingDir: number;
  public imageData: ImageData;
  public gameObject: Phaser.GameObjects.Image | null;
  public attackObject: Phaser.GameObjects.Text | null;
  public attackObjectBackground: Phaser.GameObjects.Arc | null;
  public healthObject: Phaser.GameObjects.Text | null;
  public healthObjectBackground: Phaser.GameObjects.Arc | null;
  public levelObject: Phaser.GameObjects.Sprite | null;
  public xp: number;
  public depth: number;
  public scale: number;
  public scaleMod: number;

  constructor(type: UnitType) {
    const { attack, health, imageData } = getUnitDataFromType(type);

    this.id = nanoid();
    this.startX = Math.random() * 600;
    this.startY = 200;
    this.attack = attack;
    this.health = health;
    this.facingDir = 1;
    this.imageData = imageData;
    this.type = type;
    this.gameObject = null;
    this.attackObject = null;
    this.attackObjectBackground = null;
    this.healthObject = null;
    this.healthObjectBackground = null;
    this.levelObject = null;
    this.xp = 1;
    this.depth = 0;
    this.scale = 1;
    this.scaleMod = 1;
  }

  preload(load: Phaser.Loader.LoaderPlugin) {
    load.image(this.imageData.key, this.imageData.path);
    load.spritesheet(EImageKey.Level, levelImagePath, {
      frameWidth: 242,
      frameHeight: 142,
    });
  }

  create(add: Phaser.GameObjects.GameObjectFactory) {
    this.gameObject = add.image(this.startX, this.startY, this.imageData.key);

    const numberSize = 24;

    const fontStyle = {
      fontSize: "20px",
      fontFamily: "Verdana",
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
  }

  update() {
    if (
      this.attackObject &&
      this.healthObject &&
      this.gameObject &&
      this.attackObjectBackground &&
      this.healthObjectBackground &&
      this.levelObject
    ) {
      const separation = 20 * this.scale;
      const leftX = this.gameObject.x - separation;
      const rightX = this.gameObject.x + separation;
      const positionY =
        this.gameObject.y + this.gameObject.displayHeight / 2 + 20;
      this.attackObject.x = leftX - this.healthObject.displayWidth / 2;
      this.attackObject.y = positionY - this.healthObject.displayHeight / 2;
      this.attackObject.scale = this.scale;
      this.attackObject.depth = this.depth + 2;

      this.healthObject.x = rightX - this.healthObject.displayWidth / 2;
      this.healthObject.y = positionY - this.healthObject.displayHeight / 2;
      this.healthObject.scale = this.scale;
      this.healthObject.depth = this.depth + 2;

      this.attackObjectBackground.x = leftX;
      this.attackObjectBackground.y = positionY;
      this.attackObjectBackground.scale = this.scale;
      this.attackObjectBackground.depth = this.depth + 1;

      this.healthObjectBackground.x = rightX;
      this.healthObjectBackground.y = positionY;
      this.healthObjectBackground.scale = this.scale;
      this.healthObjectBackground.depth = this.depth + 1;

      this.levelObject.x = this.gameObject.x;
      this.levelObject.y =
        this.gameObject.y - this.gameObject.displayHeight / 2 - 20;
      this.levelObject.scale = this.scale * 0.35;
      this.levelObject.depth = this.depth + 1;
      this.levelObject.setFrame(this.xp - 1);
    }

    if (this.gameObject) {
      this.gameObject.scale = lerp(
        this.gameObject.scale,
        this.scale * this.imageData.scale * this.scaleMod,
        0.2
      );
    }
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

export const areUnitsMergable = (unit1: Unit, unit2: Unit): boolean => {
  return unit1.type === unit2.type && unit1.xp < MAX_XP && unit2.xp < MAX_XP;
};
