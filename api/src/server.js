require("dotenv").config();

const { logAppError } = require("./helpers/logAppError");
const { ensureClubsSeeded, refreshClubsCache } = require("./helpers/clubs");
const { migrateOrphanTasksToNextEvent } = require("./helpers/taskMigration");

// node-xlrd (EJS .xls parsing) can throw synchronously inside an fs completion callback on a malformed file - that escapes any try/catch and would otherwise kill the whole process for every user over one bad upload.
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception (process kept alive):", error);
  logAppError({ error, context: { kind: "uncaughtException" } });
});

// No request context here - still worth capturing so a swallowed async failure isn't invisible.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  logAppError({ error: reason instanceof Error ? reason : new Error(String(reason)), context: { kind: "unhandledRejection" } });
});

const usersRoutes = require("./routes/users");
const superAdminRoutes = require("./routes/superAdmin");
const teamsRoutes = require("./routes/teams");
const streamRoutes = require("./routes/stream");
const crossPassesRoutes = require("./routes/crossPasses");
const dogTasksRoutes = require("./routes/dogTasks");
const eventsRoutes = require("./routes/events");
const tasksRoutes = require("./routes/tasks");
const dogsRoutes = require("./routes/dogs");
const clubSettingsRoutes = require("./routes/clubSettings");
const resourcesRoutes = require("./routes/resources");
const pushSubscriptionsRoutes = require("./routes/pushSubscriptions");
const competitionsRoutes = require("./routes/competitions");
const { startReminderScheduler } = require("./reminderScheduler");

const express = require("express");
const mongoose = require("mongoose");

const cors = require("cors");

const app = express();

// CORS_ORIGIN was already being passed to this process in e2e's
// global-setup.ts, but nothing here ever read it - this was wide open to
// any origin. Falls back to permissive when unset (local dev, where the
// frontend's own port varies) rather than breaking that flow.
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN } : undefined));

// middleware
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);

  next();
});

app.use("/users", usersRoutes);
app.use("/super-admin", superAdminRoutes());
app.use("/teams", teamsRoutes);
app.use("/stream", streamRoutes);
app.use("/cross-passes", crossPassesRoutes);
app.use("/dog-tasks", dogTasksRoutes);
app.use("/events", eventsRoutes);
app.use("/tasks", tasksRoutes);
app.use("/dogs", dogsRoutes);
app.use("/club-settings", clubSettingsRoutes);
app.use("/resources", resourcesRoutes);
app.use("/push-subscriptions", pushSubscriptionsRoutes);
app.use("/competitions", competitionsRoutes);

// Express 5 forwards a rejected async handler here automatically - one place to persist every uncaught request failure with its full context.
app.use((error, req, res, next) => {
  console.error(error);
  logAppError({ error, req, statusCode: 500 });

  if (res.headersSent) return next(error);

  res.status(500).json({ error: "INTERNAL_ERROR" });
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("Connected to DB");

    // Additive one-time seed - fills the clubs collection from the old hardcoded lists the first time it's empty.
    await ensureClubsSeeded();
    await refreshClubsCache();

    // One-time: re-home pre-existing (global) task plans onto each club's next session board.
    await migrateOrphanTasksToNextEvent().catch((error) => console.error("Task migration failed:", error));

    app.listen(process.env.PORT, () => {
      console.log(`Listening on port ${process.env.PORT}`);
    });

    startReminderScheduler();
  })
  .catch((error) => {
    console.log(error);
  });
