const TaskModel = require("../models/taskModel");
const TeamModel = require("../models/teamModel");
const UserModel = require("../models/userModel");
const CrossPassModel = require("../models/crossPassModel");
const { broadcast } = require("../sse");

const findClubTasks = (club) =>
  TaskModel.find({ team: club }).sort({ createdAt: -1 });

const findClubTeams = (club) =>
  TeamModel.find({ team: club }).sort({ createdAt: -1 });

const findClubUsers = (club) =>
  UserModel.find({ team: club, roles: { $nin: ["SUPER_ADMIN"] } }).sort({
    createdAt: -1,
  });

const findClubCrossPasses = (club) =>
  CrossPassModel.find({ team: club }).sort({ createdAt: -1 });

// Dog is embedded (denormalized) inside Tasks, Teams (both the dog pool and
// every lineup, incl. lineup cross-pass predecessors), and Users - every
// place a dog is nested needs its copy either refreshed (on update,
// replacement is the fresh dog) or dropped/detached (on delete, replacement
// is null). A dog that OWNS a lineup cross-pass leg (crossPass.dogId) has
// that leg removed entirely on delete - it's meaningless without its runner.
// Shared by both dog write paths - the dedicated /dogs route (dogController)
// and the super-admin generic entity grid (superAdminController) - so
// neither one can bypass it and re-orphan every reference to the dog.
const replaceDogEverywhere = async (club, dogId, replacement) => {
  const clubTasks = await TaskModel.find({ team: club });

  const taskUpdates = clubTasks
    .filter((task) => task.dogs.some((taskDog) => taskDog._id.toString() === dogId))
    .map((task) => ({
      updateOne: {
        filter: { _id: task._id },
        update: {
          dogs: replacement
            ? task.dogs.map((taskDog) =>
                taskDog._id.toString() === dogId ? replacement : taskDog
              )
            : task.dogs.filter((taskDog) => taskDog._id.toString() !== dogId),
        },
      },
    }));

  if (taskUpdates.length) await TaskModel.bulkWrite(taskUpdates);

  const clubTeams = await TeamModel.find({ team: club });

  const refreshLineupCrossPasses = (crossPasses) =>
    crossPasses
      // Owner leg gone - the pass is meaningless without its runner.
      .filter((crossPass) => replacement || crossPass.dogId.toString() !== dogId)
      .map((crossPass) => {
        if (crossPass.runningOnDog?._id?.toString() !== dogId) return crossPass.toObject();

        const { runningOnDog, ...rest } = crossPass.toObject();

        return replacement ? { ...rest, runningOnDog: replacement } : rest;
      });

  const teamUpdates = clubTeams
    .filter(
      (team) =>
        team.dogs.some((teamDog) => teamDog._id.toString() === dogId) ||
        team.matchups.some(
          (lineup) =>
            lineup.dogs.some((lineupDog) => lineupDog._id.toString() === dogId) ||
            lineup.crossPasses.some(
              (crossPass) =>
                crossPass.dogId.toString() === dogId ||
                crossPass.runningOnDog?._id?.toString() === dogId
            )
        )
    )
    .map((team) => ({
      updateOne: {
        filter: { _id: team._id },
        update: {
          dogs: replacement
            ? team.dogs.map((teamDog) =>
                teamDog._id.toString() === dogId ? replacement : teamDog
              )
            : team.dogs.filter((teamDog) => teamDog._id.toString() !== dogId),
          matchups: team.matchups.map((lineup) => ({
            ...lineup.toObject(),
            dogs: replacement
              ? lineup.dogs.map((lineupDog) =>
                  lineupDog._id.toString() === dogId ? replacement : lineupDog
                )
              : lineup.dogs.filter(
                  (lineupDog) => lineupDog._id.toString() !== dogId
                ),
            crossPasses: refreshLineupCrossPasses(lineup.crossPasses),
          })),
        },
      },
    }));

  if (teamUpdates.length) await TeamModel.bulkWrite(teamUpdates);

  const clubUsers = await UserModel.find({ team: club });

  const userUpdates = clubUsers
    .filter((user) => user.dogs.some((userDog) => userDog._id.toString() === dogId))
    .map((user) => ({
      updateOne: {
        filter: { _id: user._id },
        update: {
          dogs: replacement
            ? user.dogs.map((userDog) =>
                userDog._id.toString() === dogId ? replacement : userDog
              )
            : user.dogs.filter((userDog) => userDog._id.toString() !== dogId),
        },
      },
    }));

  if (userUpdates.length) await UserModel.bulkWrite(userUpdates);

  // Standalone CrossPasses (My Dogs page) - same two rules as lineup ones:
  // owned passes are removed on delete, predecessor references are cleared
  // on delete or refreshed on update.
  let crossPassesChanged = false;

  if (!replacement) {
    const { deletedCount } = await CrossPassModel.deleteMany({
      team: club,
      dogId,
    });

    crossPassesChanged = crossPassesChanged || deletedCount > 0;
  }

  const predecessorFilter = { team: club, "runningOnDog._id": dogId };
  const predecessorUpdate = replacement
    ? { runningOnDog: replacement }
    : { $unset: { runningOnDog: "" } };

  const { modifiedCount } = await CrossPassModel.updateMany(
    predecessorFilter,
    predecessorUpdate
  );

  crossPassesChanged = crossPassesChanged || modifiedCount > 0;

  return {
    tasksChanged: taskUpdates.length > 0,
    teamsChanged: teamUpdates.length > 0,
    usersChanged: userUpdates.length > 0,
    crossPassesChanged,
  };
};

const broadcastDogCascade = async (
  club,
  { tasksChanged, teamsChanged, usersChanged, crossPassesChanged }
) => {
  if (tasksChanged) broadcast(club, "tasks_updated", await findClubTasks(club));
  if (teamsChanged) broadcast(club, "teams_updated", await findClubTeams(club));
  if (usersChanged) broadcast(club, "users_updated", await findClubUsers(club));
  if (crossPassesChanged) {
    broadcast(club, "cross_passes_updated", await findClubCrossPasses(club));
  }
};

module.exports = { replaceDogEverywhere, broadcastDogCascade };
