// Extra EJS-derived stats: changeover-by-predecessor, records (PBs), and net-vs-gross time. All read the same
// parsed CompetitionEntry rows as competitionStats.js, over whatever set the caller has already scoped.

const { crossSeconds } = require("./competitionStats");

const isNum = (value) => typeof value === "number" && !Number.isNaN(value);
// A real dog run down and back is never under ~2s - anything smaller is a mis-parsed changeover cell, not a run time.
const isRunTime = (value) => isNum(value) && value >= 2;
const isOkText = (value) => typeof value === "string" && value.trim().toLowerCase() === "ok";
const average = (numbers) => (numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null);
const isCleanHeat = (dogs) => dogs.length > 0 && dogs.every((dog) => !dog.faulted);
// A team-level "clean" heat: no dog faulted AND no rerun pass - a rerun always means something went wrong that heat.
const isCleanTeamHeat = (entry) => isCleanHeat(entry.dogs || []) && (!entry.extraPasses || entry.extraPasses.length === 0);

// Each dog's changeover quality (dog slots 2-4) split by whichever dog ran immediately before it in that heat.
const computePredecessorStats = (entries) => {
  const byPair = new Map();

  for (const entry of entries) {
    const dogs = entry.dogs || [];

    for (let index = 1; index < dogs.length; index += 1) {
      const dog = dogs[index] && dogs[index].name;
      const predecessor = dogs[index - 1] && dogs[index - 1].name;

      if (!dog || !predecessor) continue;

      const key = JSON.stringify([dog, predecessor]);
      const acc = byPair.get(key) || { dog, predecessor, heats: 0, faultCount: 0, okCount: 0, crossTimes: [], runTimes: [] };

      acc.heats += 1;
      if (dogs[index].faulted) acc.faultCount += 1;
      else if (isOkText(dogs[index].crossTime)) acc.okCount += 1;

      // An "ok" code counts at the seconds it stands for (ok 0.10 / Ok 0.05 / OK 0), same as the main dog stats.
      const cross = dogs[index].faulted ? null : crossSeconds(dogs[index].crossTime);

      if (cross !== null) acc.crossTimes.push(cross);
      if (!dogs[index].faulted && isRunTime(dogs[index].time)) acc.runTimes.push(dogs[index].time);

      byPair.set(key, acc);
    }
  }

  return [...byPair.values()].map(({ crossTimes, runTimes, ...rest }) => ({
    ...rest,
    avgCrossTime: average(crossTimes),
    avgRunTime: average(runTimes),
    faultRate: rest.heats ? rest.faultCount / rest.heats : null,
  }));
};

// Fastest clean team net time (and where it happened), plus each dog's fastest clean solo run.
const computeRecords = (entries, eventNameById = {}) => {
  const teamBest = new Map();
  const dogBest = new Map();
  const nameFor = (entry) => ({ eventId: String(entry.eventId), eventName: eventNameById[String(entry.eventId)] || null });

  for (const entry of entries) {
    const dogs = entry.dogs || [];

    if (isCleanTeamHeat(entry) && isNum(entry.teamNetTime)) {
      const current = teamBest.get(entry.teamName);

      if (!current || entry.teamNetTime < current.value) {
        teamBest.set(entry.teamName, {
          teamName: entry.teamName,
          value: entry.teamNetTime,
          division: entry.division ?? null,
          dogs: dogs.map((dog) => dog.name || "?"),
          ...nameFor(entry),
        });
      }
    }

    dogs.forEach((dog) => {
      if (!dog.name || dog.faulted || !isRunTime(dog.time)) return;

      const current = dogBest.get(dog.name);

      if (!current || dog.time < current.value) dogBest.set(dog.name, { dog: dog.name, value: dog.time, ...nameFor(entry) });
    });
  }

  return {
    teamBests: [...teamBest.values()].sort((a, b) => a.value - b.value),
    dogBests: [...dogBest.values()].sort((a, b) => a.value - b.value),
  };
};

// Gross vs net team time per team, and how much the passing overlaps save versus the four dogs running solo. Clean heats only.
const computeNetVsGross = (entries) => {
  const byTeam = new Map();

  for (const entry of entries) {
    const dogs = entry.dogs || [];

    if (!isCleanTeamHeat(entry) || !isNum(entry.teamNetTime)) continue;

    const acc = byTeam.get(entry.teamName) || { gross: [], net: [], startOverhead: [], overlap: [] };

    acc.net.push(entry.teamNetTime);

    if (isNum(entry.teamTime)) {
      acc.gross.push(entry.teamTime);
      acc.startOverhead.push(entry.teamTime - entry.teamNetTime);
    }

    const dogTimes = dogs.map((dog) => dog.time).filter(isRunTime);

    if (dogTimes.length === dogs.length) {
      acc.overlap.push(dogTimes.reduce((sum, value) => sum + value, 0) - entry.teamNetTime);
    }

    byTeam.set(entry.teamName, acc);
  }

  return [...byTeam.entries()]
    .map(([teamName, acc]) => ({
      teamName,
      heats: acc.net.length,
      avgGross: average(acc.gross),
      avgNet: average(acc.net),
      avgStartOverhead: average(acc.startOverhead),
      avgOverlap: average(acc.overlap),
    }))
    .sort((a, b) => String(a.teamName).localeCompare(String(b.teamName)));
};

module.exports = { computePredecessorStats, computeRecords, computeNetVsGross };
