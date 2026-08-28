const {
  createUser,
  getAllUsers,
  getUserById,
  deleteUserById,
  updateUserById,
} = require("../controllers/userController");

const routes = (io, socket) => {
  const userToken = socket.handshake.query.token;

  socket.on("get_all_users", (callback) => getAllUsers(callback, userToken));

  socket.on("add_user", (received, callback) =>
    createUser(received, callback, io, userToken)
  );

  socket.on("get_user", (received, callback) =>
    getUserById(received, callback)
  );

  socket.on("delete_user", (received) =>
    deleteUserById(received, io, userToken)
  );

  socket.on("update_user", (received, callback) =>
    updateUserById(received, callback, io, userToken)
  );
};

module.exports = routes;
