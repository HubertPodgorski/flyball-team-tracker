const {
  createTask,
  getAllTasks,
  getTaskById,
  deleteTaskById,
  updateTaskById,
  updateTasksOrder,
} = require("../controllers/taskController");

const routes = (io, socket) => {
  const userToken = socket.handshake.query.token;

  socket.on("get_all_tasks", (callback) => getAllTasks(callback, userToken));

  socket.on("add_task", (received, callback) =>
    createTask(received, callback, io, userToken)
  );

  socket.on("get_task", (received, callback) =>
    getTaskById(received, callback)
  );

  socket.on("delete_task", (received) =>
    deleteTaskById(received, io, userToken)
  );

  socket.on("update_task", (received, callback) => {
    return updateTaskById(received, callback, io, userToken);
  });

  socket.on("update_tasks_order", (received) =>
    updateTasksOrder(received, io, userToken)
  );
};

module.exports = routes;
