import Phaser from "phaser";
import { uniqBy } from "lodash";
import { nanoid } from "nanoid";

export enum UnitType {
  Skeleton = "Skeleton",
}

export interface Unit {
  id: string;
  startX: number;
  startY: number;
  attack: number;
  health: number;
  flipX: boolean;
  type: UnitType;
  imageData: ImageData;
  gameObject: Phaser.GameObjects.Image | null;
}

interface ImageData {
  key: string;
  path: string;
  scale: number;
}

const getImageFromType = (type: UnitType): ImageData => {
  switch (type) {
    case UnitType.Skeleton:
    default:
      return {
        key: UnitType.Skeleton,
        path: "assets/skeleton.png",
        scale: 0.35,
      };
  }
};

export const createUnit = (type: UnitType): Unit => {
  const imageData = getImageFromType(type);
  return {
    id: nanoid(),
    startX: Math.random() * 600,
    startY: 200,
    attack: 1,
    health: 1,
    flipX: true,
    imageData,
    type,
    gameObject: null,
  };
};

export const preloadUnitImages = (
  units: Unit[],
  load: Phaser.Loader.LoaderPlugin
) => {
  uniqBy(
    units.map((unit) => unit.imageData),
    (data) => data.key
  ).map((data) => load.image(data.key, data.path));
};
