import { find } from "lodash";
import { IFightEvent } from "../scenes/battle";
import { Field } from "../objects/fields/field";
import { Unit } from "../objects/units/unit";
import { moveTowards, rotateTowardAngle } from "./helpers";

export const animateFight = (
  e: IFightEvent,
  myField: Field<Unit>,
  opponentsField: Field<Unit>,
  step: number
) => {
  const pct = step / e.duration;
  const hitTime = Math.round(e.duration * 0.4);

  const leftUnit = find(
    myField.contents,
    (content) => e.affectedUnitIds[0] === content.id
  );
  const rightUnit = find(
    opponentsField.contents,
    (content) => e.affectedUnitIds[1] === content.id
  );

  if (!leftUnit || !rightUnit) {
    console.log("Error: Unit is missing!");
    return;
  }

  if (step === hitTime) {
    leftUnit.health -= rightUnit.attack;
    rightUnit.health -= leftUnit.attack;
  }

  const fAngle1 = -0.4;
  const rot = rotateTowardAngle(0, 0.2, 0, fAngle1, pct);
  if (rot) {
    leftUnit.gameObject.rotation = rot;
    rightUnit.gameObject.rotation = -rot;
  }

  const fAngle2 = 0.7;
  const rot2 = rotateTowardAngle(0.3, 0.4, fAngle1, fAngle2, pct);
  if (rot2) {
    leftUnit.gameObject.rotation = rot2;
    rightUnit.gameObject.rotation = -rot2;
  }

  const rot3 = rotateTowardAngle(0.6, 0.8, fAngle2, 0, pct);
  const rot4 = rotateTowardAngle(0.4, 1, fAngle2, -8, pct);

  if (e.doesLeftUnitSurvive) {
    if (rot3) {
      leftUnit.gameObject.rotation = rot3;
    }
  } else if (rot4) {
    leftUnit.gameObject.rotation = rot4;
  }

  if (e.doesRightUnitSurvive) {
    if (rot3) {
      rightUnit.gameObject.rotation = -rot3;
    }
  } else if (rot4) {
    rightUnit.gameObject.rotation = -rot4;
  }

  const backupDist = -40;

  const movement1 = moveTowards(0, 0.3, 0, backupDist, pct);
  if (movement1) {
    leftUnit.animX = movement1;
    rightUnit.animX = -movement1;
  }

  const moveDist = 150;
  const movement2 = moveTowards(0.3, 0.4, backupDist, moveDist, pct);
  if (movement2) {
    leftUnit.animX = movement2;
    rightUnit.animX = -movement2;
  }

  const startMove2 = 0.4;
  const finishMove2 = 0.65;

  if (pct >= startMove2 && pct <= finishMove2) {
    const movement =
      35 *
      Math.sin(
        Math.PI * Math.pow((pct - startMove2) / (finishMove2 - startMove2), 0.7)
      );

    if (e.doesLeftUnitSurvive) {
      leftUnit.animX = backupDist + moveDist - movement;
    }
    if (e.doesRightUnitSurvive) {
      rightUnit.animX = -backupDist - moveDist + movement;
    }
  }

  const startMove3 = 0.8;
  const finishMove3 = 1;

  if (pct >= startMove3 && pct <= finishMove3) {
    const movement =
      Math.sin(
        (Math.PI / 2) * ((pct - startMove3) / (finishMove3 - startMove3))
      ) *
      (moveDist + backupDist);

    if (e.doesLeftUnitSurvive) {
      leftUnit.animX = backupDist + moveDist - movement;
    }
    if (e.doesRightUnitSurvive) {
      rightUnit.animX = -backupDist - moveDist + movement;
    }
  }

  const movement3 = moveTowards(0.4, 1, 0, 1400, pct);
  if (!e.doesLeftUnitSurvive && movement3) {
    leftUnit.animX = backupDist + moveDist - movement3;
    leftUnit.animY = -movement3 / 4;
  }
  if (!e.doesRightUnitSurvive && movement3) {
    rightUnit.animX = -backupDist - moveDist + movement3;
    rightUnit.animY = -movement3 / 4;
  }
};
