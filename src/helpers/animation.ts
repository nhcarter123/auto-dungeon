export const rotateTowardAngle = (
  startRotation: number,
  finishRotation: number,
  startAngle: number,
  finishAngle: number,
  percentage: number
) => {
  if (percentage >= startRotation && percentage <= finishRotation) {
    return (
      (startAngle || 0) +
      ((finishAngle - startAngle) * (percentage - startRotation)) /
        (finishRotation - startRotation)
    );
  }
};

export const moveTowards = (
  startMove: number,
  finishMove: number,
  start: number,
  finish: number,
  percentage: number
) => {
  if (percentage >= startMove && percentage <= finishMove) {
    return (
      start +
      ((percentage - startMove) / (finishMove - startMove)) * (finish - start)
    );
  }
};
