const isNumeric = (value) => typeof value === "number";
const isOk = (value) => typeof value === "string" && value.trim().toLowerCase() === "ok";

const average = (numbers) => (numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null);

// One dog's passes across every given entry - filter entries first (by sourceFile/day, date range, matchedLineupId, etc.) to scope the stats to whatever cut is wanted.
const collectDogPasses = (entries, dogId) => {
  const passes = [];

  for (const entry of entries) {
    entry.dogs.forEach((dog, index) => {
      if (String(dog.matchedDogId) !== String(dogId)) return;

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

// Count of each exact "ok" text as it appears in the sheet ("ok"/"Ok"/"OK") - all count as the same clean pass, but the pie chart breaks them out.
const countByText = (passes) => {
  const counts = {};

  passes.forEach((pass) => {
    const key = pass.timingValue.trim();

    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
};

// "ok" passes are clean but have no number to average - tracked as their own count/rate, kept out of avgCrossTime/avgLightsTime.
const computeDogStats = (entries, dogId) => {
  const passes = collectDogPasses(entries, dogId);
  const faulted = passes.filter((pass) => pass.faulted);
  const clean = passes.filter((pass) => !pass.faulted);
  const cleanNumeric = clean.filter((pass) => isNumeric(pass.timingValue));
  const cleanOk = clean.filter((pass) => isOk(pass.timingValue));

  return {
    totalPasses: passes.length,
    faultCount: faulted.length,
    faultRate: passes.length ? faulted.length / passes.length : null,
    cleanCount: clean.length,
    okCount: cleanOk.length,
    okByText: countByText(cleanOk),
    okPercentOfAllPasses: passes.length ? cleanOk.length / passes.length : null,
    okPercentOfCleanPasses: clean.length ? cleanOk.length / clean.length : null,
    avgCrossTime: average(cleanNumeric.filter((pass) => pass.role === "cross").map((pass) => pass.timingValue)),
    avgLightsTime: average(cleanNumeric.filter((pass) => pass.role === "lights").map((pass) => pass.timingValue)),
    avgRunTime: average(clean.map((pass) => pass.time).filter(isNumeric)),
  };
};

// Every distinct matched dog - stringified first, since matchedDogId is a Mongoose ObjectId and a Set can't dedupe two instances of the same value.
const computeStatsForAllDogs = (entries) => {
  const dogIds = new Set(entries.flatMap((entry) => entry.dogs.map((dog) => dog.matchedDogId).filter(Boolean).map(String)));

  return [...dogIds].map((dogId) => ({ dogId, ...computeDogStats(entries, dogId) }));
};

module.exports = { computeDogStats, computeStatsForAllDogs };
