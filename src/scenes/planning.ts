import Phaser from "phaser";
import { EImageKey, Unit } from "../objects/unit";
import { Field, ReorderStatus } from "../objects/field";
import { Good, Shop } from "../objects/shop";
import { Button } from "../objects/button";
import moment from "moment";
import { screenHeight, screenWidth } from "../config";
import { lerp } from "../utils";

export enum EMouseEvent {
  PointerDown = "pointerdown",
  PointerOver = "pointerover",
  PointerOut = "pointerout",
  PointerUp = "pointerup",
}

const levelImagePath = "assets/sprites/level/texture.png";

export default class Demo extends Phaser.Scene {
  private field: Field;
  private shop: Shop;
  private rollButton: Button | undefined;
  private sellButton: Button | undefined;
  private nextButton: Button | undefined;
  private selected: Good | undefined;
  private selectedOffsetX: number;
  private selectedOffsetY: number;
  private mouseClicked: boolean;
  private mouseReleased: boolean;
  private mouseRightClicked: boolean;

  constructor() {
    super("GameScene");

    const halfScreenWidth = screenWidth / 2;

    this.field = new Field(halfScreenWidth, 250, halfScreenWidth - 50);
    this.shop = new Shop(halfScreenWidth, 650, halfScreenWidth - 50);
    this.selectedOffsetX = 0;
    this.selectedOffsetY = 0;
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
    this.rollButton = new Button(
      this.add,
      EImageKey.RollButton,
      150,
      screenHeight - 100,
      this.shop.roll.bind(this.shop)
    );
    this.sellButton = new Button(
      this.add,
      EImageKey.SellButton,
      350,
      screenHeight - 100,
      () => {}
    );
    this.nextButton = new Button(
      this.add,
      EImageKey.NextButton,
      screenWidth - 150,
      screenHeight - 100,
      this.goToFight.bind(this)
    );
    this.field.create(this.add);
    this.shop.create(this.add);

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

    const showSellButton =
      Boolean(this.selected) && !this.shop.contains(this.selected?.id || "");

    if (this.sellButton?.gameObject) {
      this.sellButton.gameObject.visible = showSellButton;
    }

    this.field.units.forEach((unit) => unit.update());
    this.field.update();
    this.shop.goods.forEach((good) => good.update());
    this.rollButton?.update(!this.selected);
    this.sellButton?.update(showSellButton);
    this.nextButton?.update(!this.selected);

    const mouseX = this.selected
      ? this.input.mousePointer.x + this.selectedOffsetX
      : this.input.mousePointer.x;
    const mouseY = this.selected
      ? this.input.mousePointer.y + this.selectedOffsetY
      : this.input.mousePointer.y;

    let reorderStatus: ReorderStatus = {
      targetIndex: -1,
      mergingUnit: undefined,
    };

    if (this.selected) {
      this.selected.gameObject.x = lerp(
        this.selected.gameObject.x,
        mouseX,
        0.14
      );
      this.selected.gameObject.y = lerp(
        this.selected.gameObject.y,
        mouseY,
        0.14
      );

      if (this.selected instanceof Unit) {
        reorderStatus = this.field.reorderField(mouseX, mouseY, this.selected);
      }
    }

    this.shop.scaleGoods();
    this.field.scaleUnits();

    this.field.positionUnits(0.08, this.selected?.id);
    this.shop.positionGoods(0.08, this.selected?.id);

    let hoveredGood: Good | undefined;

    if (!this.selected || reorderStatus.mergingUnit) {
      hoveredGood = this.field.hoverUnit(mouseX, mouseY);

      if (!hoveredGood) {
        hoveredGood = this.shop.hoverGoods(mouseX, mouseY);
      }
    }

    if (hoveredGood && hoveredGood.id !== this.selected?.id) {
      hoveredGood.scaleMod = 1.1;
    }

    if (this.mouseClicked) {
      this.mouseClicked = false;

      this.selected = hoveredGood;

      if (this.selected) {
        this.selected.depth = 100;
        this.selectedOffsetX =
          this.selected.gameObject.x - this.input.mousePointer.x;
        this.selectedOffsetY =
          this.selected.gameObject.y - this.input.mousePointer.y;

        if (
          this.shop.contains(this.selected.id) &&
          this.selected instanceof Unit
        ) {
          // this.field.units.push(this.selected);
          this.field.units.splice(
            Math.ceil(this.field.units.length / 2),
            0,
            this.selected
          );
        }
      }
    }

    if (this.mouseReleased) {
      this.mouseReleased = false;

      if (this.selected) {
        if (this.selected instanceof Unit) {
          if (showSellButton && this.sellButton?.hovered) {
            this.field.removeUnit(this.selected.id);
            this.selected.delete();
          } else if (reorderStatus.mergingUnit) {
            // buy
            if (this.shop.contains(this.selected.id)) {
              this.shop.removeGood(this.selected.id);
            }

            this.field.mergeUnits(reorderStatus.mergingUnit, this.selected);
          } else {
            this.selected.depth = 0;

            if (this.shop.contains(this.selected.id)) {
              // buy
              if (reorderStatus.targetIndex >= 0) {
                this.shop.removeGood(this.selected.id);
              } else {
                // return to shop
                this.field.removeUnit(this.selected.id);
              }
            }
          }
        }
      }
      this.field.startedHoverTime = moment();
      this.field.hoveredUnitId = "";
      this.selected = undefined;
    }
  }

  goToFight() {}
}
