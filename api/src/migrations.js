require("dotenv").config();
const UserModel = require("./models/userModel");
const TaskModel = require("./models/taskModel");
const mongoose = require("mongoose");
const DogModel = require("./models/dogModel");
const DogTaskModel = require("./models/dogTaskModel");
const EventModel = require("./models/eventModel");
const EventTemplateModel = require("./models/eventTemplateModel");
const runMigrations = async () => {
  await mongoose.connect(process.env.MONGO_URL);

  // Add team field to all users
  // const result1 = await DogModel.updateMany(
  //   {},
  //   { $set: { team: "DZIKIE_GZIKI" } }
  // );
  // console.log("result1 => ", result1);
  //
  // const result2 = await DogTaskModel.updateMany(
  //   {},
  //   { $set: { team: "DZIKIE_GZIKI" } }
  // );
  //
  // console.log("result2 => ", result2);
  //
  // const result3 = await EventModel.updateMany(
  //   {},
  //   { $set: { team: "DZIKIE_GZIKI" } }
  // );
  //
  // console.log("result3 => ", result3);
  //
  // const result4 = await EventTemplateModel.updateMany(
  //   {},
  //   { $set: { team: "DZIKIE_GZIKI" } }
  // );
  //
  // console.log("result4 => ", result4);
  //
  // const result5 = await TaskModel.updateMany(
  //   {},
  //   { $set: { team: "DZIKIE_GZIKI" } }
  // );
  //
  // console.log("result5 => ", result5);
  //
  // const result6 = await UserModel.updateMany(
  //   {},
  //   { $set: { team: "DZIKIE_GZIKI" } }
  // );
  //
  // console.log("result6 => ", result6);

  // Add note field to every dog
  // const result7 = await DogModel.updateMany({}, { $set: { note: "" } });
  //
  // console.log("result7 => ", result7);
};

runMigrations();
