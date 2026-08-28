const {
  createDogTask,
  getAllDogTasks,
  getDogTaskById,
  deleteDogTaskById,
  updateDogTaskById,
} = require("../controllers/dogTaskController");

const routes = (io, socket) => {
  const userToken = socket.handshake.query.token;

  socket.on("get_all_dog_tasks", (callback) =>
    getAllDogTasks(callback, userToken)
  );

  socket.on("add_dog_task", (received, callback) =>
    createDogTask(received, callback, io, userToken)
  );

  socket.on("get_dog_task", (received, callback) =>
    getDogTaskById(received, callback)
  );

  socket.on("delete_dog_task", (received) =>
    deleteDogTaskById(received, io, userToken)
  );

  socket.on("update_dog_task", (received, callback) =>
    updateDogTaskById(received, callback, io, userToken)
  );
};

module.exports = routes;
