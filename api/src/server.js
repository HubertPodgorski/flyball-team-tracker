require("dotenv").config();

const usersRoutes = require("./routes/users");
const superAdminRoutes = require("./routes/superAdmin");
const teamsRoutes = require("./routes/teams");
const streamRoutes = require("./routes/stream");
const crossPassesRoutes = require("./routes/crossPasses");
const dogTasksRoutes = require("./routes/dogTasks");
const eventsRoutes = require("./routes/events");
const tasksRoutes = require("./routes/tasks");
const dogsRoutes = require("./routes/dogs");

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

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to DB");

    app.listen(process.env.PORT, () => {
      console.log(`Listening on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
