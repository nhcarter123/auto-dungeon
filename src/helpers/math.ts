import { EEventSpeed } from "../scenes/battle";
import { saveData } from "../index";

export const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end;

export const calculateDuration = (speed: EEventSpeed, mod?: number) => {
  return Math.round(((mod || 1) * speed) / saveData.fastForward);
};
