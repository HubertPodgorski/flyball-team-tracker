// Minimal Express-shaped res mock for calling route handlers directly in
// integration tests (real Mongoose models via mongodb-memory-server, no
// real HTTP/Express involved).
const mockRes = () => {
  const res = {};

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (body) => {
    res.body = body;
    return res;
  };

  res.end = () => {
    res.ended = true;
    return res;
  };

  return res;
};

module.exports = { mockRes };
