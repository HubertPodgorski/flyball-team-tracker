const {
  createDog,
  getAllDogs,
  getDogById,
  deleteDogById,
  updateDogById,
} = require("../controllers/dogController");

const routes = (io, socket) => {
  const userToken = socket.handshake.query.token;

  socket.on("get_all_dogs", (callback) => getAllDogs(callback, userToken));

  socket.on("add_dog", (received, callback) =>
    createDog(received, callback, io, userToken)
  );

  socket.on("get_dog", (received, callback) => getDogById(received, callback));

  socket.on("delete_dog", (received) => deleteDogById(received, io, userToken));

  socket.on("update_dog", (received, callback) =>
    updateDogById(received, callback, io, userToken)
  );
};

module.exports = routes;
