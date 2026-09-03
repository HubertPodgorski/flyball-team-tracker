const express = require("express");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const {
  entityConfig,
  getList,
  createItem,
  updateItem,
  deleteItem,
  resetUserPassword,
} = require("../controllers/superAdminController");

const superAdminRoutes = () => {
  const router = express.Router();

  router.use(requireSuperAdmin);

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
