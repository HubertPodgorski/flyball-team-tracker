const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

// Every route now verifies the JWT signature (see decodeToken.js/stream.js),
// but this one guards privileged, cross-team access specifically - it goes
// one step further and re-checks the role against the DB on every request,
// rather than trusting a `roles` claim baked into the token at login time.
const requireSuperAdmin = async (req, res, next) => {
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

  const user = await UserModel.findById(decoded._id);

  if (!user || !user.roles?.includes("SUPER_ADMIN")) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  next();
};

module.exports = requireSuperAdmin;
