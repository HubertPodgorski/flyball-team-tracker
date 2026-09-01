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

  clients.forEach((res) => res.write(payload));
};

module.exports = { addClient, removeClient, broadcast };
