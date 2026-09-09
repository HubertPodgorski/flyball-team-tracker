// Ordered dog-id sequence -> that lineup's own id, across every team in the club (embedded lineup dogs keep the real Dog._id - see dogCascade.js).
const buildLineupIndex = (teams) => {
  const index = new Map();

  for (const team of teams) {
    for (const lineup of team.matchups || []) {
      if (!lineup.dogs || lineup.dogs.length !== 4) continue;

      index.set(lineup.dogs.map((dog) => dog._id.toString()).join("|"), lineup._id);
    }
  }

  return index;
};

// Exact running order only - a lineup is an ordered 4-dog set, so any missing match or reordering is treated as no match.
const matchLineup = (matchedDogIds, lineupIndex) => {
  if (matchedDogIds.length !== 4 || matchedDogIds.some((id) => !id)) return null;

  return lineupIndex.get(matchedDogIds.map((id) => id.toString()).join("|")) || null;
};

module.exports = { buildLineupIndex, matchLineup };
