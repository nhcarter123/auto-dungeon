import Phaser from "phaser";
import { screenHeight, screenWidth } from "../config";
import { EImageKey, ESpriteKey } from "../objects/good/units/unit";
import { ToolTip } from "../objects/toolTip";
import { GameInfo } from "../objects/gameInfo";
import { BaseAnim } from "../objects/animation/baseAnim";

export const IMAGE_FOLDER = "assets/images";

export default class GameScene extends Phaser.Scene {
  public currentEventIndex: number;
  public delayStep: number;
  public durationStep: number;
  public animationObjects: BaseAnim[];
  public toolTip: ToolTip | undefined;
  private gameInfo: GameInfo | undefined;

  constructor(scene: string) {
    super(scene);

    this.delayStep = 0;
    this.durationStep = 0;
    this.currentEventIndex = -1;
    this.animationObjects = [];
  }

  preload() {
    Object.values(EImageKey).forEach((key) =>
      this.load.image(key, `${IMAGE_FOLDER}/${key}.png`)
    );

    this.load.spritesheet(
      ESpriteKey.Level,
      "assets/sprites/level/texture.png",
      {
        frameWidth: 170,
        frameHeight: 124,
      }
    );
  }

  create() {
    this.gameInfo = new GameInfo(this.add, 50, 50);
    this.toolTip = new ToolTip(this.add, screenWidth - 300, 212);

    const background = this.add.image(
      screenWidth / 2,
      screenHeight / 2,
      EImageKey.BackgroundSwamp
    );
    background.depth = -10;

    this.events.on("wake", () => this.setup());
    this.setup();
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    this.gameInfo?.update();
    this.toolTip?.update();
  }

  setup() {
    this.clearAnimationObjects();
    this.clearFields();
  }

  animateEvent() {}

  clearAnimationObjects() {
    this.animationObjects.forEach((anim) => {
      console.log("Animation object was not destroyed in animation");
      anim.destroy();
    });
    this.animationObjects = [];
  }

  clearFields() {}
}
