// Per-team registry of open SSE connections.
const clientsByTeam = new Map();

const addClient = (team, res) => {
  if (!clientsByTeam.has(team)) clientsByTeam.set(team, new Set());

  clientsByTeam.get(team).add(res);
};

const removeClient = (team, res) => {
  clientsByTeam.get(team)?.delete(res);
};

const broadcast = (team, event, data) => {
  const clients = clientsByTeam.get(team);

  if (!clients) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  // A stale client (closed but not yet cleaned up) throws on write, which
  // would otherwise abort delivery to every client still left in the loop.
  clients.forEach((res) => {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  });
};

module.exports = { addClient, removeClient, broadcast };
