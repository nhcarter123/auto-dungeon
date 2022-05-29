import { EEventSpeed } from "../scenes/battle";
import { saveData } from "../index";

export const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end;

export const calculateDuration = (speed: EEventSpeed) => {
  return Math.round(speed / saveData.fastForward);
};
