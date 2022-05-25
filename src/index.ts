import Phaser from "phaser";
import config from "./config";
import PlanningScene from "./scenes/planning";
import BattleScene from "./scenes/battle";

new Phaser.Game(
  Object.assign(config, {
    scene: [BattleScene, PlanningScene],
  })
);
