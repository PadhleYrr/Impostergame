// api/rooms/join.js
const { getDb } = require("../_db");
const { v4: uuid } = require("uuid");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const db = await getDb();
    const { code, nickname, avatar, color } = req.body;

    if (!code || !nickname) return res.status(400).json({ error: "Code and nickname required" });

    const room = await db.collection("rooms").findOne({ code: code.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.status === "ended") return res.status(400).json({ error: "Game has ended" });

    const player = {
      _id: uuid(),
      roomId: room._id,
      nickname: nickname.trim().slice(0, 16),
      avatar: avatar || "🎭",
      color: color || "#ec4899",
      score: 0,
      isActive: true,
      joinedAt: new Date().toISOString(),
    };

    await db.collection("players").insertOne(player);

    res.status(200).json({
      room: mongoToRoom(room),
      player: mongoToPlayer(player),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

function mongoToRoom(r) {
  return { id: r._id, code: r.code, hostId: r.hostId, mode: r.mode, status: r.status, currentRound: r.currentRound, currentRoundId: r.currentRoundId, createdAt: r.createdAt };
}
function mongoToPlayer(p) {
  return { id: p._id, roomId: p.roomId, nickname: p.nickname, avatar: p.avatar, color: p.color, score: p.score, isActive: p.isActive, joinedAt: p.joinedAt };
}
