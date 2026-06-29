"use strict";
const { getDb } = require("../_db");

function uuid() {
  return crypto.randomUUID();
}

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function toRoom(r) {
  return { id: r._id, code: r.code, hostId: r.hostId, mode: r.mode, status: r.status, currentRound: r.currentRound, currentRoundId: r.currentRoundId, createdAt: r.createdAt };
}
function toPlayer(p) {
  return { id: p._id, roomId: p.roomId, nickname: p.nickname, avatar: p.avatar, color: p.color, score: p.score, isActive: p.isActive, joinedAt: p.joinedAt };
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const db = await getDb();
    const { nickname, avatar, color } = req.body;
    if (!nickname) return res.status(400).json({ error: "Nickname required" });

    const playerId = uuid();
    const player = {
      _id: playerId,
      nickname: nickname.trim().slice(0, 16),
      avatar: avatar || "🎭",
      color: color || "#ec4899",
      score: 0,
      isActive: true,
      joinedAt: new Date().toISOString(),
    };

    for (let i = 0; i < 10; i++) {
      const code = randomCode();
      const roomId = uuid();
      const room = {
        _id: roomId,
        code,
        hostId: playerId,
        mode: "classic",
        status: "lobby",
        currentRound: 0,
        currentRoundId: null,
        createdAt: new Date().toISOString(),
      };
      try {
        await db.collection("rooms").insertOne(room);
        player.roomId = roomId;
        await db.collection("players").insertOne(player);
        return res.status(200).json({ room: toRoom(room), player: toPlayer(player) });
      } catch (e) {
        if (e.code === 11000) continue;
        throw e;
      }
    }
    res.status(500).json({ error: "Could not generate unique room code" });
  } catch (e) {
    console.error("create room error:", e);
    res.status(500).json({ error: e.message });
  }
};
