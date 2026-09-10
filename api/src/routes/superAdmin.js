const express = require("express");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const {
  entityConfig,
  getList,
  createItem,
  updateItem,
  deleteItem,
  resetUserPassword,
  getClubs,
  createClub,
  updateClub,
  deleteClub,
} = require("../controllers/superAdminController");
const { getAppErrors, clearAppErrors } = require("../controllers/appErrorController");

const superAdminRoutes = () => {
  const router = express.Router();

  router.use(requireSuperAdmin);

  // Before the generic entity routes - "errors" and "clubs" are not team-scoped and have their own shapes.
  router.get("/errors", getAppErrors);
  router.delete("/errors", clearAppErrors);

  router.get("/clubs", getClubs);
  router.post("/clubs", createClub);
  router.patch("/clubs", updateClub);
  router.delete("/clubs/:_id", deleteClub);

  Object.keys(entityConfig).forEach((entity) => {
    router.get(`/${entity}`, getList(entity));
    router.post(`/${entity}`, createItem(entity));
    router.patch(`/${entity}`, updateItem(entity));
    router.delete(`/${entity}/:_id`, deleteItem(entity));
  });

  router.patch("/users/:_id/reset-password", resetUserPassword);

  return router;
};

module.exports = superAdminRoutes;
