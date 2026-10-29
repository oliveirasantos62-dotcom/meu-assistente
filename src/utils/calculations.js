export const getTodayDate = () => new Date().toISOString().slice(0, 10);

export const MOOD_SCORES = {
  'Muito mal': 1,
  Mal: 2,
  Neutro: 3,
  Bem: 4,
  'Muito bem': 5,
};

export const calculateLevelInfo = (xp) => {
  const level = Math.floor(xp / 100) + 1;
  const nextXP = level * 100 - xp;
  const progress = xp % 100 === 0 ? 100 : xp % 100;
  return { level, nextXP, progress };
};

export const calculateProductivityScore = (daily) => {
  const sleepValue = Number(daily.sleep) || 0;
  const energyValue = Number(daily.energy) || 0;
  const focusValue = Number(daily.focus) || 0;

  return Math.min(
    100,
    Math.round(
      Math.min(1, (daily.completed || 0) / 3) * 45 +
        Math.min(1, (daily.habits || 0) / 3) * 20 +
        Math.min(1, (MOOD_SCORES[daily.mood] || 0) / 5) * 15 +
        Math.min(1, energyValue / 5) * 10 +
        Math.min(1, focusValue / 5) * 10,
    ),
  );
};

export const calculateBestHour = (completionTimes = []) => {
  const hours = completionTimes.map((v) => new Date(v).getHours());
  if (!hours.length) return null;

  const counts = hours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
};

export const generatePeriodRecords = (period, history) => {
  const total = Number(period);
  const days = Array.from({ length: total }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (total - 1 - index));
    return date.toISOString().slice(0, 10);
  });

  return days.map((key) => ({ key, ...(history[key] || {}) }));
};
