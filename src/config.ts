import Phaser from "phaser";

export const screenWidth = 1600;
export const screenHeight = 900;

export enum EScene {
  Planning = "Planning",
  Battle = "Battle",
}

export default {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#33A5E7",
  scale: {
    width: screenWidth,
    height: screenHeight,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
