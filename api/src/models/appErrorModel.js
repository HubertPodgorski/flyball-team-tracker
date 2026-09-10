const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// A captured server-side failure, surfaced in the super-admin Errors panel so a
// snackbar the user saw can be traced without them re-describing it.
const appErrorSchema = new Schema(
  {
    message: { type: String, required: true },
    stack: { type: String },
    method: { type: String },
    route: { type: String },
    statusCode: { type: Number },
    // The club being acted as, and the acting user - both absent for failures caught outside a request (see unhandledRejection in server.js).
    club: { type: String },
    userId: { type: String },
    // Anything extra worth tracing - a request body snippet, a parser's own detail, counts.
    context: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Auto-expire after 30 days so this never grows unbounded.
appErrorSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("AppError", appErrorSchema);
