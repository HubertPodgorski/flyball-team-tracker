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

// The task board is scoped to the nearest upcoming event; clear a shared club's events so a spec's board is deterministic (the default board).
export const deleteAllEvents = async (club: string): Promise<void> => {
  const client = new MongoClient(getMongoUrl());

  try {
    await client.connect();
    await client.db().collection("events").deleteMany({ team: club });
  } finally {
    await client.close();
  }
};

// For specs that assert on "copy from a previously planned session" - a clean slate so only this spec's plans exist.
export const deleteAllTasks = async (club: string): Promise<void> => {
  const client = new MongoClient(getMongoUrl());

  try {
    await client.connect();
    await client.db().collection("tasks").deleteMany({ team: club });
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

    const db = client.db();

    await db.collection("squads").insertOne({
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

    // Also real Dog documents (same ids) - DogDetailsModal looks a dog up here, not in any team's embedded roster.
    await db.collection("dogs").insertMany([
      { _id: dogA._id, name: dogAName, team: club },
      { _id: dogB._id, name: dogBName, team: club },
    ]);
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

// A team plus two CompetitionEntry rows whose running orders differ - two data-derived lineups for the lineup chart.
export const seedCompetitionWithLineups = async (
  club: string,
  eventName: string
): Promise<{ eventId: string; teamName: string; dogAName: string; dogBName: string }> => {
  const client = new MongoClient(getMongoUrl());

  const suffix = Date.now();
  const teamId = new ObjectId();
  const teamName = `Seeded Comp Team ${suffix}`;
  const dogA = { _id: new ObjectId(), name: `Seeded Comp Dog A ${suffix}` };
  const dogB = { _id: new ObjectId(), name: `Seeded Comp Dog B ${suffix}` };
  const eventId = new ObjectId();
  const key = (dogs: { name: string }[]) => dogs.map((dog) => dog.name).join("|");

  try {
    await client.connect();

    const db = client.db();

    // Also a real Dog doc per dog - the stats endpoint resolves each row's name via DogModel.find({team}).
    await db.collection("dogs").insertMany([
      { _id: dogA._id, name: dogA.name, team: club },
      { _id: dogB._id, name: dogB.name, team: club },
    ]);

    await db.collection("squads").insertOne({ _id: teamId, name: teamName, team: club, dogs: [dogA, dogB], matchups: [] });

    await db.collection("events").insertOne({
      _id: eventId,
      name: eventName,
      date: new Date().toISOString().slice(0, 10),
      type: "COMPETITION",
      team: club,
    });

    await db.collection("competitionentries").insertMany([
      {
        eventId,
        lineupKey: key([dogA, dogB]),
        teamName,
        team: club,
        ourTeam: true,
        dogs: [
          { name: dogA.name, matchedDogId: dogA._id, lightsTime: 4.1, faulted: false },
          { name: dogB.name, matchedDogId: dogB._id, crossTime: 4.3, faulted: false },
        ],
        extraPasses: [],
      },
      {
        eventId,
        lineupKey: key([dogB, dogA]),
        teamName,
        team: club,
        ourTeam: true,
        dogs: [
          { name: dogB.name, matchedDogId: dogB._id, lightsTime: 4.5, faulted: true },
          { name: dogA.name, matchedDogId: dogA._id, crossTime: "ok", faulted: false },
        ],
        extraPasses: [],
      },
    ]);
  } finally {
    await client.close();
  }

  return { eventId: eventId.toString(), teamName, dogAName: dogA.name, dogBName: dogB.name };
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

export const seedAppError = async (
  overrides: Record<string, unknown> = {}
): Promise<void> => {
  const client = new MongoClient(getMongoUrl());

  try {
    await client.connect();

    await client.db().collection("apperrors").insertOne({
      message: "Seeded failure",
      stack: "Error: Seeded failure\n    at somewhere (file.js:1:1)",
      method: "POST",
      route: "/competitions/x/ejs-confirm",
      statusCode: 500,
      context: { stage: "persist" },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  } finally {
    await client.close();
  }
};
