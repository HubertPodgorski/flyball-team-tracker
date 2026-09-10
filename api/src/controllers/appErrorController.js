const AppErrorModel = require("../models/appErrorModel");

const LIST_LIMIT = 200;

const getAppErrors = async (req, res) => {
  const errors = await AppErrorModel.find().sort({ createdAt: -1 }).limit(LIST_LIMIT);

  res.status(200).json(errors);
};

const clearAppErrors = async (req, res) => {
  await AppErrorModel.deleteMany({});

  res.status(200).json({ ok: true });
};

module.exports = { getAppErrors, clearAppErrors };
