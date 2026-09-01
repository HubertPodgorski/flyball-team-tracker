import { Lineup, LineupCrossPass, Team, Task } from "./types";

export interface LinkedLineup {
  team: Team;
  lineup: Lineup;
}

// "Active" means dogs still match the lineup, identity and order.
export const findLinkedLineup = (
  task: Task,
  teams: Team[]
): LinkedLineup | undefined => {
  if (!task.matchupRef) return undefined;

  const team = teams.find(({ _id }) => _id === task.matchupRef!.squadId);
  const lineup = team?.matchups.find(
    ({ _id }) => _id === task.matchupRef!.matchupId
  );

  if (!team || !lineup) return undefined;

  const sameLength = task.dogs.length === lineup.dogs.length;
  const sameOrder =
    sameLength && task.dogs.every(({ _id }, index) => lineup.dogs[index]._id === _id);

  if (!sameOrder) return undefined;

  return { team, lineup };
};

// Team doc with one lineup's crossPasses replaced.
export const withLineupCrossPasses = (
  team: Team,
  lineupId: string,
  crossPasses: LineupCrossPass[]
): Team => ({
  ...team,
  matchups: team.matchups.map((m) => (m._id === lineupId ? { ...m, crossPasses } : m)),
});
