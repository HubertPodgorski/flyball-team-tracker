const normalize = (name) => (name || "").trim().toLowerCase();

// Standard edit-distance DP - small alphabet, short dog names, no need for anything fancier.
const levenshtein = (a, b) => {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);

  for (let col = 1; col < cols; col++) table[0][col] = col;

  for (let row = 1; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;

      table[row][col] = Math.min(table[row - 1][col] + 1, table[row][col - 1] + 1, table[row - 1][col - 1] + cost);
    }
  }

  return table[rows - 1][cols - 1];
};

const AUTO_MATCH_MAX_DISTANCE = 1;

// Auto-matches an exact or one-typo-away name against exactly one club dog - anything blank, unmatched, or tied between two candidates is left for manual review.
const matchDogName = (rawName, clubDogs) => {
  const target = normalize(rawName);
  const scored = clubDogs
    .map((dog) => ({ dogId: dog._id, name: dog.name, distance: levenshtein(target, normalize(dog.name)) }))
    .sort((a, b) => a.distance - b.distance);
  const [best, second] = scored;
  const isUnambiguous = !second || second.distance > best.distance;
  const autoMatched = !!target && !!best && best.distance <= AUTO_MATCH_MAX_DISTANCE && isUnambiguous;

  return {
    name: rawName,
    matchedDogId: autoMatched ? best.dogId : null,
    suggestions: scored.slice(0, 3),
  };
};

const matchDogNames = (names, clubDogs) => names.map((name) => matchDogName(name, clubDogs));

module.exports = { matchDogNames };
