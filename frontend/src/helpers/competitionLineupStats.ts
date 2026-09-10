import { CompetitionDogStats, CompetitionLineup } from "./types";

interface RowIdentity {
  dogId: string;
  name: string | null;
  nameSubLabel?: string | null;
}

const sumOkByText = (dogs: CompetitionDogStats[]): Record<string, number> =>
  dogs.reduce<Record<string, number>>((acc, dog) => {
    Object.entries(dog.okByText).forEach(([text, count]) => {
      acc[text] = (acc[text] ?? 0) + count;
    });

    return acc;
  }, {});

// Sums a group of dog rows into one row, then rebuilds every rate from those summed counts - a group's own % isn't the average of its members' %s.
export const aggregateStatsRow = ({ dogId, name, nameSubLabel = null }: RowIdentity, dogs: CompetitionDogStats[]): CompetitionDogStats => {
  const totalPasses = dogs.reduce((sum, dog) => sum + dog.totalPasses, 0);
  const faultCount = dogs.reduce((sum, dog) => sum + dog.faultCount, 0);
  const okCount = dogs.reduce((sum, dog) => sum + dog.okCount, 0);
  const cleanCount = totalPasses - faultCount;

  return {
    dogId,
    name,
    nameSubLabel,
    totalPasses,
    faultCount,
    faultRate: totalPasses ? faultCount / totalPasses : null,
    cleanCount,
    okCount,
    okByText: sumOkByText(dogs),
    okPercentOfAllPasses: totalPasses ? okCount / totalPasses : null,
    okPercentOfCleanPasses: cleanCount ? okCount / cleanCount : null,
    avgCrossTime: null,
    avgLightsTime: null,
    avgRunTime: null,
  };
};

export const aggregateLineupRow = (lineup: CompetitionLineup, dogs: CompetitionDogStats[]): CompetitionDogStats =>
  aggregateStatsRow({ dogId: lineup.key, name: lineup.order }, dogs);

// One row per opponent club - every dog that ran for that club, summed. Its name is the club name, no sub-label.
export const aggregateClubRow = (teamName: string, dogs: CompetitionDogStats[]): CompetitionDogStats =>
  aggregateStatsRow({ dogId: teamName, name: teamName }, dogs.filter((dog) => dog.teamName === teamName));
