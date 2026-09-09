import { CompetitionDogStats, Lineup } from "./types";

// Sums a lineup's 4 dogs into one row, then rebuilds the rates from those summed counts - a lineup's own % isn't the average of its dogs' %s.
export const aggregateLineupRow = (lineup: Lineup, dogs: CompetitionDogStats[]): CompetitionDogStats => {
  const order = lineup.dogs.map((dog) => dog.name).join(" → ");
  const totalPasses = dogs.reduce((sum, dog) => sum + dog.totalPasses, 0);
  const faultCount = dogs.reduce((sum, dog) => sum + dog.faultCount, 0);
  const okCount = dogs.reduce((sum, dog) => sum + dog.okCount, 0);
  const cleanCount = totalPasses - faultCount;

  return {
    dogId: lineup._id,
    name: lineup.name || order,
    // Only a separate line when the name isn't already the order itself - otherwise it'd just repeat.
    nameSubLabel: lineup.name ? order : null,
    totalPasses,
    faultCount,
    faultRate: totalPasses ? faultCount / totalPasses : null,
    cleanCount,
    okCount,
    okByText: {},
    okPercentOfAllPasses: totalPasses ? okCount / totalPasses : null,
    okPercentOfCleanPasses: cleanCount ? okCount / cleanCount : null,
    avgCrossTime: null,
    avgLightsTime: null,
    avgRunTime: null,
  };
};
