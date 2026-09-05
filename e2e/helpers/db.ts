import { MongoClient, ObjectId } from "mongodb";
import { readFileSync } from "fs";
import path from "path";

const RUNTIME_FILE = path.join(__dirname, "../.e2e-runtime.json");

const getMongoUrl = (): string => {
  const { mongoUrl } = JSON.parse(readFileSync(RUNTIME_FILE, "utf-8"));

  return mongoUrl;
};

export const promoteToTrainer = async (email: string): Promise<void> => {
  const client = new MongoClient(getMongoUrl());

  try {
    await client.connect();

    await client
      .db()
      .collection("users")
      .updateOne({ email }, { $set: { roles: ["TRAINER"] } });
  } finally {
    await client.close();
  }
};

// Seeds a team with one lineup of two dogs, bypassing the drag-and-drop UI
// entirely - direct insert into the "squads" collection (see teamModel.js).
// Names carry a unique suffix (tests often share one club) so a locator for
// this team/lineup never ambiguously matches a leftover from another run.
export const seedTeamWithLineup = async (
  club: string
): Promise<{
  teamId: string;
  lineupId: string;
  teamName: string;
  lineupName: string;
  dogAName: string;
  dogBName: string;
  dogs: { _id: string; name: string }[];
}> => {
  const client = new MongoClient(getMongoUrl());

  const suffix = Date.now();
  const teamId = new ObjectId();
  const lineupId = new ObjectId();
  const teamName = `Seeded Team ${suffix}`;
  const lineupName = `Seeded Lineup ${suffix}`;
  const dogAName = `Seeded Dog A ${suffix}`;
  const dogBName = `Seeded Dog B ${suffix}`;
  const dogA = { _id: new ObjectId(), name: dogAName };
  const dogB = { _id: new ObjectId(), name: dogBName };

  try {
    await client.connect();

    await client
      .db()
      .collection("squads")
      .insertOne({
        _id: teamId,
        name: teamName,
        team: club,
        dogs: [dogA, dogB],
        matchups: [
          {
            _id: lineupId,
            name: lineupName,
            dogs: [dogA, dogB],
            crossPasses: [],
          },
        ],
      });
  } finally {
    await client.close();
  }

  return {
    teamId: teamId.toString(),
    lineupId: lineupId.toString(),
    teamName,
    lineupName,
    dogAName,
    dogBName,
    dogs: [
      { _id: dogA._id.toString(), name: dogA.name },
      { _id: dogB._id.toString(), name: dogB.name },
    ],
  };
};

// A task linked to a lineup - findLinkedLineup (lineupLink.ts) only treats a
// task as "linked" (opening TaskLineupModal instead of the plain task form)
// when its own `dogs` snapshot exactly matches the lineup's roster, same
// ids and order, so this must carry the same dogs seedTeamWithLineup made.
export const seedLineupLinkedTask = async (
  club: string,
  squadId: string,
  matchupId: string,
  description: string,
  dogs: { _id: string; name: string }[]
): Promise<void> => {
  const client = new MongoClient(getMongoUrl());

  try {
    await client.connect();

    await client
      .db()
      .collection("tasks")
      .insertOne({
        team: club,
        description,
        dogs: dogs.map(({ _id, name }) => ({ _id: new ObjectId(_id), name })),
        matchupRef: { squadId: new ObjectId(squadId), matchupId: new ObjectId(matchupId) },
        position: { columnIndex: 0, rowIndex: 0, positionIndex: 0 },
      });
  } finally {
    await client.close();
  }
};

export const promoteToSuperAdmin = async (email: string): Promise<void> => {
  const client = new MongoClient(getMongoUrl());

  try {
    await client.connect();

    await client
      .db()
      .collection("users")
      .updateOne({ email }, { $set: { roles: ["SUPER_ADMIN"] } });
  } finally {
    await client.close();
  }
};
