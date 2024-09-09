import { DateTime } from 'luxon';
export const calculateRequiredXp = (level) => {
  let xpNeeded;
  const nextLevel = level + 1;
  switch (true) {
    case level < 6:
      xpNeeded = nextLevel * 1000;
      break;
    case level < 9:
      xpNeeded = 4000 + (nextLevel - 5) * 2000;
      break;
    case level < 16:
      xpNeeded = 12000 + (nextLevel - 9) * 4000;
      break;
    case level < 36:
      xpNeeded = 40000 + (nextLevel - 16) * 5000;
      break;
    case level < 56:
      xpNeeded = 140000 + (nextLevel - 36) * 7500;
      break;
    case level >= 56:
      xpNeeded = 290000 + (nextLevel - 56) * 10000;
      break;
    default:
      xpNeeded = 0;
      break;
  }

  return xpNeeded;
};

export const calculateRemainingStamina = (hero) => {
  const secondsPerStaminaPoint = 1200;
  const currentTime = DateTime.fromJSDate(new Date());
  const staminaFullAt = hero.staminaFullAt && DateTime.fromJSDate(new Date(hero.staminaFullAt));

  if (!staminaFullAt || staminaFullAt <= currentTime) {
    return hero.stats.stamina;
  }

  const diffInSeconds = staminaFullAt.diff(currentTime, ['seconds']);
  const finalDiff = diffInSeconds.toObject().seconds;

  if (finalDiff) {
    return hero.stats.stamina - Math.ceil(finalDiff / secondsPerStaminaPoint);
  } else {
    return hero.stats.stamina;
  }
};
