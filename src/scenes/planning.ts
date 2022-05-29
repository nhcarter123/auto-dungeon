import Phaser from "phaser";
import { Shop } from "../objects/fields/shop";
import { Button } from "../objects/button";
import moment from "moment";
import { EScene, screenHeight, screenWidth } from "../config";
import { PlanningField, ReorderStatus } from "../objects/fields/planningField";
import { EEventType, TShopEvent } from "./battle";
import { animateBuff } from "../animations/buff";
import { saveData } from "../index";
import { createUnitFromType, reduceUnit } from "../helpers/unit";
import { lerp } from "../helpers/math";
import { GameInfo } from "../objects/gameInfo";
import { EImageKey, Unit } from "../objects/good/units/unit";
import { Good } from "../objects/good/good";
import { ToolTip } from "../objects/toolTip";

export enum EMouseEvent {
  PointerDown = "pointerdown",
  PointerOver = "pointerover",
  PointerOut = "pointerout",
  PointerUp = "pointerup",
}

const EVENT_DELAY = 30;

export default class Planning extends Phaser.Scene {
  private field: PlanningField;
  private shop: Shop;
  private rollButton: Button | undefined;
  private sellButton: Button | undefined;
  private toolTip: ToolTip | undefined; // TODO add scene inheritance for things like tooltip and resources
  private nextButton: Button | undefined;
  private gameInfo: GameInfo | undefined;
  private selected: Good | undefined;
  private mouseClicked: boolean;
  private mouseReleased: boolean;
  private canInteract: boolean;
  private eventQueue: TShopEvent[];
  private currentEvent: TShopEvent | undefined;
  private delayStep: number;
  private durationStep: number;
  private clickedNextButton: boolean;
  private buffObjects: Phaser.GameObjects.Arc[];

  // private selectedOffsetX: number;
  // private selectedOffsetY: number;

  constructor() {
    super(EScene.Planning);

    const halfScreenWidth = screenWidth / 2;

    this.field = new PlanningField(650, 250, halfScreenWidth - 50);
    this.shop = new Shop(650, 550, halfScreenWidth - 50);
    // this.selectedOffsetX = 0;
    // this.selectedOffsetY = 0;
    this.mouseClicked = false;
    this.mouseReleased = false;
    this.canInteract = true;
    this.eventQueue = [];
    this.delayStep = 0;
    this.durationStep = 0;
    this.clickedNextButton = false;
    this.buffObjects = [];
  }

  preload() {
    this.load.image(EImageKey.Gold, "assets/images/gold.png");
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
    this.field.contents = saveData.units.map((unit) =>
      createUnitFromType(this.add, unit.type, unit)
    );

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
      this.endTurn.bind(this)
    );

    this.gameInfo = new GameInfo(this.add, 50, 50);
    this.toolTip = new ToolTip(this.add, screenWidth - 300, 212);

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

    if (!this.currentEvent && this.eventQueue.length) {
      this.currentEvent = this.eventQueue.pop();
    }

    if (!this.currentEvent && this.clickedNextButton) {
      this.goToBattle();
    }

    if (this.currentEvent) {
      this.canInteract = false;

      if (this.delayStep > EVENT_DELAY) {
        if (this.currentEvent) {
          if (this.durationStep > this.currentEvent.duration) {
            this.durationStep = 0;
            this.delayStep = 0;
            this.currentEvent = undefined;
          } else {
            this.animateEvent();
          }
        }

        this.durationStep += 1;
      }

      this.delayStep += 1;
    }

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
    this.gameInfo?.update();
    this.toolTip?.update();

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

    if (this.canInteract && (!this.selected || reorderStatus.mergingUnit)) {
      hovered = this.field.hoverContent(mouseX, mouseY);

      if (!hovered) {
        hovered = this.shop.hoverContent(mouseX, mouseY);
      }
    }

    if (hovered && hovered.id !== this.selected?.id) {
      hovered.scaleMod = 1.1;

      if (this.toolTip) {
        this.toolTip.good = hovered;
      }
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
          this.field.contents.push(this.selected);
          // this.field.contents.splice(
          //   Math.ceil(this.field.contents.length / 2),
          //   0,
          //   this.selected
          // );
        }
      }
    }

    if (this.mouseReleased) {
      this.mouseReleased = false;

      if (this.selected) {
        if (this.selected instanceof Unit) {
          this.selected.depth = 0;

          if (showSellButton && this.sellButton?.hovered) {
            this.field.removeContent(this.selected.id);
            this.selected.delete();
          } else if (reorderStatus.mergingUnit) {
            if (saveData.gold >= this.selected.cost) {
              // buy
              saveData.gold -= this.selected.cost;
              this.shop.removeContent(this.selected.id);
              this.field.mergeUnits(reorderStatus.mergingUnit, this.selected);
            } else {
              // return to shop
              this.field.removeContent(this.selected.id);
            }
          } else {
            if (this.shop.contains(this.selected.id)) {
              if (
                reorderStatus.targetIndex >= 0 &&
                saveData.gold >= this.selected.cost
              ) {
                // buy
                saveData.gold -= this.selected.cost;
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

  animateEvent() {
    if (this.currentEvent) {
      switch (this.currentEvent.type) {
        case EEventType.Buff:
          this.buffObjects = animateBuff(
            this.currentEvent,
            this.field.contents,
            this.buffObjects,
            this.add,
            this.durationStep
          );
          break;
      }
    }
  }

  setInteractive(interactive: boolean) {
    this.rollButton && (this.rollButton.disabled = !interactive);
    this.nextButton && (this.nextButton.disabled = !interactive);
    this.canInteract = interactive;
  }

  endTurn() {
    this.clickedNextButton = true;
    this.setInteractive(false);

    // trigger end turn events
    this.field.contents.forEach((content) => {
      const endTurnEvent = content.createEndTurnEvent(this.field);

      if (endTurnEvent) {
        this.eventQueue.push(endTurnEvent);
      }
    });
  }

  goToBattle() {
    this.clickedNextButton = false;
    this.setInteractive(true);

    saveData.units = this.field.contents
      .map((content) => reduceUnit(content))
      .reverse();
    this.scene.switch(EScene.Battle);
  }
}
