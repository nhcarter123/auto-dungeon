import { pick } from "lodash";
import Phaser from "phaser";
import { EUnitType, TUnitOverrides, Unit } from "../objects/good/units/unit";
import { Ogre } from "../objects/good/units/ogre";
import { Skeleton } from "../objects/good/units/skeleton";
import { Golem } from "../objects/good/units/golem";
import { Spider } from "../objects/good/units/spider";

export type TReducedUnitData = TUnitOverrides & Pick<Unit, "type">;

export const reduceUnit = (unit: Unit): TReducedUnitData => {
  return pick(unit, [
    "id",
    "attack",
    "health",
    "facingDir",
    "type",
    "xp",
    "x",
    "y",
    "visible",
  ]);
};

export const createUnitFromType = (
  add: Phaser.GameObjects.GameObjectFactory,
  type: EUnitType,
  overrides?: TUnitOverrides
) => {
  switch (type) {
    case EUnitType.Skeleton:
      return new Skeleton(add, overrides);
    case EUnitType.Ogre:
      return new Ogre(add, overrides);
    case EUnitType.Golem:
      return new Golem(add, overrides);
    case EUnitType.Spider:
      return new Spider(add, overrides);
  }
};

export const getRandomUnitType = (): EUnitType => {
  const array = Object.values(EUnitType);
  return array[Math.floor(Math.random() * array.length)];
};
