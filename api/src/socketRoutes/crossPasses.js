const {
  getAllCrossPasses,
  createCrossPass,
  deleteCrossPassById,
  updateCrossPassById,
} = require("../controllers/crossPassController");

const routes = (io, socket) => {
  const userToken = socket.handshake.query.token;

  socket.on("get_all_cross_passes", (callback) =>
    getAllCrossPasses(callback, userToken)
  );

  socket.on("create_cross_pass", (received, callback) =>
    createCrossPass(received, callback, io, userToken)
  );

  socket.on("update_cross_pass", (received, callback) =>
    updateCrossPassById(received, callback, io, userToken)
  );

  socket.on("delete_cross_pass", (received) =>
    deleteCrossPassById(received, io, userToken)
  );
};

module.exports = routes;
