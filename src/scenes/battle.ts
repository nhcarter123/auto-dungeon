import Phaser from "phaser";
import { EImageKey } from "../objects/unit";
import { Battlefield } from "../objects/fields/battlefield";
import { EScene, screenHeight, screenWidth } from "../config";

export enum EMouseEvent {
  PointerDown = "pointerdown",
  PointerOver = "pointerover",
  PointerOut = "pointerout",
  PointerUp = "pointerup",
}

const levelImagePath = "assets/sprites/level/texture.png";

export default class Battle extends Phaser.Scene {
  private myField: Battlefield;
  private opponentsField: Battlefield;
  private mouseClicked: boolean;
  private mouseReleased: boolean;
  private mouseRightClicked: boolean;

  constructor() {
    super(EScene.Battle);

    const halfScreenWidth = screenWidth / 2;
    const halfScreenHeight = screenHeight / 2;

    this.myField = new Battlefield(
      halfScreenWidth,
      halfScreenHeight,
      halfScreenWidth - 50
    );
    this.opponentsField = new Battlefield(
      halfScreenWidth,
      halfScreenHeight,
      halfScreenWidth - 50
    );
    this.mouseClicked = false;
    this.mouseReleased = false;
    this.mouseRightClicked = false;
  }

  preload() {
    this.load.image(EImageKey.RollButton, "assets/images/button_roll.png");
    this.load.image(EImageKey.SellButton, "assets/images/button_sell.png");
    this.load.image(EImageKey.NextButton, "assets/images/button_next.png");
    this.load.image(EImageKey.Swamp, "assets/images/background_swamp.png");
    this.load.image(EImageKey.Skeleton, "assets/images/skeleton.png");
    this.load.image(EImageKey.Ogre, "assets/images/ogre.png");
    this.load.image(EImageKey.Golem, "assets/images/golem.png");
    this.load.spritesheet(EImageKey.Level, levelImagePath, {
      frameWidth: 170,
      frameHeight: 124,
    });
  }

  create() {
    this.myField.create(this.add);
    this.opponentsField.create(this.add);

    const background = this.add.image(
      screenWidth / 2,
      screenHeight / 2,
      EImageKey.Swamp
    );
    background.depth = -10;

    this.input.on(
      EMouseEvent.PointerDown,
      (pointer: { rightButtonDown: () => any }) => {
        if (pointer.rightButtonDown()) {
          this.mouseRightClicked = true;
        } else {
          this.mouseClicked = true;
        }
      }
    );
    this.input.on(EMouseEvent.PointerUp, () => (this.mouseReleased = true));
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    this.myField.contents.forEach((content) => content.update());

    this.myField.scaleContent();
    this.myField.positionContent(0.08);
  }
}
