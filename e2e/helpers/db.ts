import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import path from "path";

const RUNTIME_FILE = path.join(__dirname, "../.e2e-runtime.json");

const getMongoUrl = (): string => {
  const { mongoUrl } = JSON.parse(readFileSync(RUNTIME_FILE, "utf-8"));

  return mongoUrl;
};

export const promoteToAdmin = async (email: string): Promise<void> => {
  const client = new MongoClient(getMongoUrl());

  try {
    await client.connect();

    await client
      .db()
      .collection("users")
      .updateOne({ email }, { $set: { roles: ["ADMIN"] } });
  } finally {
    await client.close();
  }
};
