import Phaser from "phaser";
import config from "./config";
import PlanningScene from "./scenes/planning";
import BattleScene from "./scenes/battle";
import { TReducedUnitData } from "./helpers/unit";
import { EUnitType } from "./objects/good/units/unit";

interface SaveData {
  units: TReducedUnitData[];
  fastForward: number;
  gold: number;
  turn: number;
}

const loadFont = (name: string) => {
  const newFont = new FontFace(name, `url("assets/fonts/${name}.ttf")`);
  newFont.load().then(function (loaded) {
    document.fonts.add(loaded);
  });
};

export const saveData: SaveData = {
  units: [
    { type: EUnitType.Skeleton },
    { type: EUnitType.Skeleton },
    { type: EUnitType.Skeleton },
  ],
  fastForward: 1,
  gold: 10,
  turn: 0,
};

loadFont("concert_one");
loadFont("bangers");

new Phaser.Game(
  Object.assign(config, {
    scene: [PlanningScene, BattleScene],
  })
);
