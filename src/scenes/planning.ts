import Phaser from "phaser";
import { EImageKey, Unit } from "../objects/units/unit";
import { Good, Shop } from "../objects/fields/shop";
import { Button } from "../objects/button";
import moment from "moment";
import { EScene, screenHeight, screenWidth } from "../config";
import { lerp } from "../utils";
import { PlanningField, ReorderStatus } from "../objects/fields/planningField";

export enum EMouseEvent {
  PointerDown = "pointerdown",
  PointerOver = "pointerover",
  PointerOut = "pointerout",
  PointerUp = "pointerup",
}

export default class Planning extends Phaser.Scene {
  private field: PlanningField;
  private shop: Shop;
  private rollButton: Button | undefined;
  private sellButton: Button | undefined;
  private nextButton: Button | undefined;
  private selected: Good | undefined;
  // private selectedOffsetX: number;
  // private selectedOffsetY: number;
  private mouseClicked: boolean;
  private mouseReleased: boolean;

  constructor() {
    super(EScene.Planning);

    const halfScreenWidth = screenWidth / 2;

    this.field = new PlanningField(halfScreenWidth, 250, halfScreenWidth - 50);
    this.shop = new Shop(halfScreenWidth, 650, halfScreenWidth - 50);
    // this.selectedOffsetX = 0;
    // this.selectedOffsetY = 0;
    this.mouseClicked = false;
    this.mouseReleased = false;
  }

  preload() {
    this.load.image(EImageKey.RollButton, "assets/images/button_roll.png");
    this.load.image(EImageKey.SellButton, "assets/images/button_sell.png");
    this.load.image(EImageKey.NextButton, "assets/images/button_next.png");
    this.load.image(EImageKey.Swamp, "assets/images/background_swamp.png");
    this.load.image(EImageKey.Skeleton, "assets/images/skeleton.png");
    this.load.image(EImageKey.Ogre, "assets/images/ogre.png");
    this.load.image(EImageKey.Golem, "assets/images/golem.png");
    this.load.spritesheet(EImageKey.Level, "assets/sprites/level/texture.png", {
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
      this.goToBattle.bind(this)
    );
    this.field.create(this.add);
    this.shop.create(this.add);

    const background = this.add.image(
      screenWidth / 2,
      screenHeight / 2,
      EImageKey.Swamp
    );
    background.depth = -10;

    this.input.on(EMouseEvent.PointerDown, () => (this.mouseClicked = true));
    this.input.on(EMouseEvent.PointerUp, () => (this.mouseReleased = true));
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    const showSellButton =
      Boolean(this.selected) && !this.shop.contains(this.selected?.id || "");

    if (this.sellButton?.gameObject) {
      this.sellButton.gameObject.visible = showSellButton;
    }

    this.field.contents.forEach((content) => content.update());
    this.field.update();
    this.shop.contents.forEach((content) => content.update());
    this.rollButton?.update(!this.selected);
    this.sellButton?.update(showSellButton);
    this.nextButton?.update(!this.selected);

    // unsure if I like this
    // this.selectedOffsetX = lerp(this.selectedOffsetX, 0, 0.2);
    // this.selectedOffsetY = lerp(this.selectedOffsetY, 0, 0.2);

    const mouseX = this.selected
      ? this.input.mousePointer.x //+ this.selectedOffsetX
      : this.input.mousePointer.x;
    const mouseY = this.selected
      ? this.input.mousePointer.y //+ this.selectedOffsetY
      : this.input.mousePointer.y;

    let reorderStatus: ReorderStatus = {
      targetIndex: -1,
      mergingUnit: undefined,
    };

    if (this.selected) {
      this.selected.x = lerp(this.selected.x, mouseX, 0.14);
      this.selected.y = lerp(this.selected.y, mouseY, 0.14);

      if (this.selected instanceof Unit) {
        reorderStatus = this.field.reorderField(mouseX, mouseY, this.selected);
      }
    }

    this.shop.scaleContent();
    this.field.scaleContent();

    this.field.positionContent(0.08, this.selected?.id);
    this.shop.positionContent(0.08, this.selected?.id);

    let hovered: Good | undefined;

    if (!this.selected || reorderStatus.mergingUnit) {
      hovered = this.field.hoverContent(mouseX, mouseY);

      if (!hovered) {
        hovered = this.shop.hoverContent(mouseX, mouseY);
      }
    }

    if (hovered && hovered.id !== this.selected?.id) {
      hovered.scaleMod = 1.1;
    }

    if (this.mouseClicked) {
      this.mouseClicked = false;

      this.selected = hovered;

      if (this.selected) {
        this.selected.depth = 100;
        // this.selectedOffsetX =
        //   this.selected.gameObject.x - this.input.mousePointer.x;
        // this.selectedOffsetY =
        //   this.selected.gameObject.y - this.input.mousePointer.y;

        if (
          this.shop.contains(this.selected.id) &&
          this.selected instanceof Unit
        ) {
          // this.field.units.push(this.selected);
          this.field.contents.splice(
            Math.ceil(this.field.contents.length / 2),
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
            this.field.removeContent(this.selected.id);
            this.selected.delete();
          } else if (reorderStatus.mergingUnit) {
            // buy
            if (this.shop.contains(this.selected.id)) {
              this.shop.removeContent(this.selected.id);
            }

            this.field.mergeUnits(reorderStatus.mergingUnit, this.selected);
          } else {
            this.selected.depth = 0;

            if (this.shop.contains(this.selected.id)) {
              // buy
              if (reorderStatus.targetIndex >= 0) {
                this.shop.removeContent(this.selected.id);
              } else {
                // return to shop
                this.field.removeContent(this.selected.id);
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

  goToBattle() {
    this.scene.switch(EScene.Battle);
  }
}
