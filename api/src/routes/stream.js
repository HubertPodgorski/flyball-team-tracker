const express = require("express");
const jwt = require("jsonwebtoken");
const { addClient, removeClient } = require("../sse");

const router = express.Router();

// Token in query string - EventSource can't set headers.
const streamHandler = (req, res) => {
  // Same requirement as decodeToken.js: verify the signature, not just parse
  // the payload. jwt.decode() alone would let anyone hand-craft a token
  // claiming any club and subscribe to that club's live broadcast feed -
  // this route was missed when decodeToken.js got the equivalent fix.
  let decoded;

  try {
    decoded = jwt.verify(req.query.token, process.env.SECRET);
  } catch (e) {
    return res.status(401).end();
  }

  const { club } = decoded;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  addClient(club, res);

  req.on("close", () => {
    removeClient(club, res);
  });
};

router.get("/", streamHandler);

module.exports = router;
module.exports.streamHandler = streamHandler;
