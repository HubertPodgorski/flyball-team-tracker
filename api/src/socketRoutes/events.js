const {
  createEvent,
  getAllEvents,
  getEventById,
  deleteEventById,
  updateEventById,
  toggleEventDog,
  toggleEventUserId,
} = require("../controllers/eventController");

const routes = (io, socket) => {
  const userToken = socket.handshake.query.token;

  socket.on("get_all_events", (callback) => getAllEvents(callback, userToken));

  socket.on("add_event", (received, callback) =>
    createEvent(received, callback, io, userToken)
  );

  socket.on("get_event", (received, callback) =>
    getEventById(received, callback)
  );

  socket.on("delete_event", (received) =>
    deleteEventById(received, io, userToken)
  );

  socket.on("update_event", (received, callback) =>
    updateEventById(received, callback, io, userToken)
  );

  socket.on("toggle_event_dog", (received) =>
    toggleEventDog(received, io, userToken)
  );

  socket.on("toggle_event_user", (received) =>
    toggleEventUserId(received, io, userToken)
  );
};

module.exports = routes;
