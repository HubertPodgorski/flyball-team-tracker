const CrossPassModel = require("../models/crossPassModel");

const jwt = require("jsonwebtoken");

// get all cross passes
const getAllCrossPasses = async (callback, userToken) => {
  const { team } = jwt.decode(userToken);

  const crossPasses = await CrossPassModel.find({ team });

  callback(crossPasses);
};

// create cross pass
const createCrossPass = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);
  const crossPass = await CrossPassModel.create({ ...received, team });

  const allCrossPasses = await CrossPassModel.find({ team });

  callback(crossPass);

  io.to(team).emit("cross_passes_updated", allCrossPasses);
};

// delete cross pass
const deleteCrossPassById = async (received, io, userToken) => {
  const { team } = jwt.decode(userToken);
  const { _id } = received;

  await CrossPassModel.findOneAndDelete({ _id });

  const allCrossPasses = await CrossPassModel.find({ team });

  io.to(team).emit("cross_passes_updated", allCrossPasses);
};

// update cross pass
const updateCrossPassById = async (received, callback, io, userToken) => {
  const { team } = jwt.decode(userToken);
  const { _id } = received;

  const crossPass = await CrossPassModel.findOneAndUpdate({ _id }, received, {
    new: true,
  });

  const allCrossPasses = await CrossPassModel.find({ team });

  callback(crossPass);

  io.to(team).emit("cross_passes_updated", allCrossPasses);
};

module.exports = {
  getAllCrossPasses,
  deleteCrossPassById,
  updateCrossPassById,
  createCrossPass,
};
