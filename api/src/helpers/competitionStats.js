const isNumeric = (value) => typeof value === "number";
const isOk = (value) => typeof value === "string" && value.trim().toLowerCase() === "ok";

// The judge's "ok" changeover codes as seconds - lowercase "ok" is the loosest still-clean pass, "OK" bang on the line.
const OK_CROSS_SECONDS = { ok: 0.1, Ok: 0.05, OK: 0 };
// A changeover value as a number: the raw number, or the seconds an "ok" code stands for, else null.
const crossSeconds = (value) => {
  if (isNumeric(value)) return value;
  if (typeof value === "string" && Object.prototype.hasOwnProperty.call(OK_CROSS_SECONDS, value.trim())) {
    return OK_CROSS_SECONDS[value.trim()];
  }

  return null;
};

const average = (numbers) => (numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null);

// Every dog slot across the given entries matching `pick` - filter entries first (by sourceFile/day, lineup, etc.) to scope the stats.
const collectPassesBy = (entries, pick) => {
  const passes = [];

  for (const entry of entries) {
    entry.dogs.forEach((dog, index) => {
      if (!pick(dog)) return;

      passes.push({
        role: index === 0 ? "lights" : "cross",
        timingValue: index === 0 ? dog.lightsTime : dog.crossTime,
        time: dog.time,
        faulted: dog.faulted,
      });
    });
  }

  return passes;
};

const collectDogPasses = (entries, dogId) => collectPassesBy(entries, (dog) => String(dog.matchedDogId) === String(dogId));

// Count of each exact "ok" text as it appears in the sheet ("ok"/"Ok"/"OK") - all count as the same clean pass, but the pie chart breaks them out.
const countByText = (passes) => {
  const counts = {};

  passes.forEach((pass) => {
    const key = pass.timingValue.trim();

    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
};

// An "ok" changeover counts toward avgCrossTime at the seconds its code stands for; run-time and lights averages stay numeric-only.
const statsFromPasses = (passes) => {
  const faulted = passes.filter((pass) => pass.faulted);
  const clean = passes.filter((pass) => !pass.faulted);
  const cleanNumeric = clean.filter((pass) => isNumeric(pass.timingValue));
  const cleanOk = clean.filter((pass) => isOk(pass.timingValue));
  const crossSecondsList = clean
    .filter((pass) => pass.role === "cross")
    .map((pass) => crossSeconds(pass.timingValue))
    .filter((value) => value !== null);

  return {
    totalPasses: passes.length,
    faultCount: faulted.length,
    faultRate: passes.length ? faulted.length / passes.length : null,
    cleanCount: clean.length,
    okCount: cleanOk.length,
    okByText: countByText(cleanOk),
    okPercentOfAllPasses: passes.length ? cleanOk.length / passes.length : null,
    okPercentOfCleanPasses: clean.length ? cleanOk.length / clean.length : null,
    avgCrossTime: average(crossSecondsList),
    avgLightsTime: average(cleanNumeric.filter((pass) => pass.role === "lights").map((pass) => pass.timingValue)),
    avgRunTime: average(clean.map((pass) => pass.time).filter(isNumeric)),
  };
};

const computeDogStats = (entries, dogId) => statsFromPasses(collectDogPasses(entries, dogId));

// Every distinct matched dog - stringified first, since matchedDogId is a Mongoose ObjectId and a Set can't dedupe two instances of the same value.
const computeStatsForAllDogs = (entries) => {
  const dogIds = new Set(entries.flatMap((entry) => entry.dogs.map((dog) => dog.matchedDogId).filter(Boolean).map(String)));

  return [...dogIds].map((dogId) => ({ dogId, ...computeDogStats(entries, dogId) }));
};

// Opponent rows never get a matchedDogId - stats are keyed on the raw parsed name instead, and each dog carries its own (opponent) team name for filtering.
const computeStatsForAllOpponentDogs = (entries) => {
  const names = [...new Set(entries.flatMap((entry) => entry.dogs.map((dog) => dog.name).filter(Boolean)))];

  return names.map((name) => {
    const teamName = entries.find((entry) => entry.dogs.some((dog) => dog.name === name))?.teamName ?? null;

    return { dogId: name, name, teamName, ...statsFromPasses(collectPassesBy(entries, (dog) => dog.name === name)) };
  });
};

module.exports = { computeDogStats, computeStatsForAllDogs, computeStatsForAllOpponentDogs, crossSeconds };
