export const getWidthForSeats = seats => {
  const fullWIdth = Math.min(window.innerHeight, window.innerWidth);
  switch (seats) {
    case 0: return 0;
    case 1: return fullWIdth;
    case 2: return fullWIdth / 2;
    case 3: return fullWIdth / (1 + 2 / Math.sqrt(3));
    case 4: return fullWIdth / (1 + Math.sqrt(2));
    case 5: return fullWIdth / (1 + Math.sqrt(2 * (1 + 1 / Math.sqrt(5))));
    case 6: return fullWIdth / 3;
    case 7: return fullWIdth / 4;
    default: return fullWIdth / 4;
  }
};
export const getDistanceRatioForSeats = seats => {
  if (seats < 2)
    return 0;
  const width = getWidthForSeats(seats);
  const fullWIdth = Math.min(window.innerHeight, window.innerWidth);
  return 50 - width / 2 / fullWIdth * 100;
};
