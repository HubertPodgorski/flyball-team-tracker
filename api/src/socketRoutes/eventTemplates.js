const {
  createEventTemplate,
  getAllEventTemplates,
  getEventTemplateById,
  deleteEventTemplateById,
  updateEventTemplateById,
  loadTasksFromEventTemplate,
} = require("../controllers/eventTemplateController");

const routes = (io, socket) => {
  const userToken = socket.handshake.query.token;

  socket.on("get_all_event_templates", (callback) =>
    getAllEventTemplates(callback, userToken)
  );

  socket.on("add_event_template", (received, callback) =>
    createEventTemplate(received, callback, io, userToken)
  );

  socket.on("get_event_template", (received, callback) =>
    getEventTemplateById(received, callback)
  );

  socket.on("delete_event_template", (received) =>
    deleteEventTemplateById(received, io, userToken)
  );

  socket.on("update_event_template", (received, callback) =>
    updateEventTemplateById(received, callback, io, userToken)
  );

  socket.on("load_tasks_from_event_template", (received) =>
    loadTasksFromEventTemplate(received, io, userToken)
  );
};

module.exports = routes;
