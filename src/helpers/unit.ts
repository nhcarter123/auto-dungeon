import { pick } from "lodash";
import Phaser from "phaser";
import { EUnitType, TUnitOverrides, Unit } from "../objects/good/units/unit";
import { Ogre } from "../objects/good/units/ogre";
import { Skeleton } from "../objects/good/units/skeleton";
import { Golem } from "../objects/good/units/golem";
import { Spider } from "../objects/good/units/spider";
import { Plant } from "../objects/good/units/plant";
import { Lizard } from "../objects/good/units/lizard";
import { Orc } from "../objects/good/units/orc";
import { OrcThief } from "../objects/good/units/orcThief";
import { ArmoredOrc } from "../objects/good/units/armoredOrc";
import { Falcon } from "../objects/good/units/falcon";

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
    case EUnitType.Plant:
      return new Plant(add, overrides);
    case EUnitType.Lizard:
      return new Lizard(add, overrides);
    case EUnitType.Orc:
      return new Orc(add, overrides);
    case EUnitType.OrcThief:
      return new OrcThief(add, overrides);
    case EUnitType.ArmoredOrc:
      return new ArmoredOrc(add, overrides);
    case EUnitType.Falcon:
      return new Falcon(add, overrides);
  }
};

export const getRandomUnitType = (): EUnitType => {
  const array = Object.values(EUnitType);
  return array[Math.floor(Math.random() * array.length)];
};
