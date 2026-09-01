const jwt = require("jsonwebtoken");

// Decode-only, no signature check (see requireSuperAdmin.js).
const decodeToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const decoded = jwt.decode(token);

  if (!decoded) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }

  req.team = decoded.team;
  req.userId = decoded._id;

  next();
};

module.exports = decodeToken;
