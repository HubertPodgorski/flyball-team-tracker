const jwt = require("jsonwebtoken");

// Real server-side check, same as requireSuperAdmin.js: verifies the
// signature against SECRET, not just a decode. jwt.decode() alone parses
// the payload with zero regard for whether it was ever actually signed by
// this server - anyone could hand-craft a token claiming any club/_id, no
// knowledge of SECRET required, and every route using this middleware
// (everything except /super-admin, which already verified correctly) would
// trust it outright.
const decodeToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.SECRET);
  } catch (e) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }

  // Fallback: old tokens (pre team->club rename) carry `team`, not `club`.
  req.club = decoded.club ?? decoded.team;
  req.userId = decoded._id;

  next();
};

module.exports = decodeToken;
