const AppErrorModel = require("../models/appErrorModel");

const MAX_STACK = 8000;
const MAX_MESSAGE = 2000;

const clip = (value, max) => (typeof value === "string" && value.length > max ? value.slice(0, max) : value);

// Fire-and-forget: persisting a failure must never itself break the request that hit it.
const logAppError = ({ error, req, statusCode, context } = {}) => {
  AppErrorModel.create({
    message: clip(error?.message || String(error), MAX_MESSAGE),
    stack: clip(error?.stack, MAX_STACK),
    method: req?.method,
    route: req?.originalUrl || req?.url,
    statusCode,
    club: req?.club,
    userId: req?.userId,
    context,
  }).catch((logError) => console.error("Failed to persist AppError:", logError));
};

module.exports = { logAppError };
