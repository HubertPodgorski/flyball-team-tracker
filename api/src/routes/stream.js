const express = require("express");
const jwt = require("jsonwebtoken");
const { addClient, removeClient } = require("../sse");

const router = express.Router();

// Token in query string - EventSource can't set headers.
router.get("/", (req, res) => {
  const decoded = jwt.decode(req.query.token);

  if (!decoded) {
    return res.status(401).end();
  }

  const { team } = decoded;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  addClient(team, res);

  req.on("close", () => {
    removeClient(team, res);
  });
});

module.exports = router;
