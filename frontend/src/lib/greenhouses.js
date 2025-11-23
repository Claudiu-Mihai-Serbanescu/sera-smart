// src/lib/greenhouses.js
export const GREENHOUSES = [
  { id: "spanac", name: "Sera Spanac", boardId: "e663ac91d3824a2c" },
  { id: "rosii", name: "Sera Rosii", boardId: "mock:mirror" },
  { id: "ardei", name: "Sera Ardei", boardId: "mock:synthetic" },
];

export const DEFAULT_GH_ID = GREENHOUSES[0]?.id || null;
export const byId = Object.fromEntries(GREENHOUSES.map((g) => [g.id, g]));
export const findById = (id) => byId[id] || null;
