const express = require("express");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const {
  entityConfig,
  getList,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/superAdminController");

const superAdminRoutes = (io) => {
  const router = express.Router();

  router.use(requireSuperAdmin);

  Object.keys(entityConfig).forEach((entity) => {
    router.get(`/${entity}`, getList(entity));
    router.post(`/${entity}`, createItem(entity, io));
    router.patch(`/${entity}`, updateItem(entity, io));
    router.delete(`/${entity}/:_id`, deleteItem(entity, io));
  });

  return router;
};

module.exports = superAdminRoutes;
