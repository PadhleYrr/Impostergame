"use strict";
const { getDb } = require("../_db");

function toRoom(r) { return { id: r._id, code: r.code, hostId: r.hostId, mode: r.mode, status: r.status, currentRound: r.currentRound, currentRoundId: r.currentRoundId, createdAt: r.createdAt }; }
function toPlayer(p) { return { id: p._id, roomId: p.roomId, nickname: p.nickname, avatar: p.avatar, color: p.color, score: p.score, isActive: p.isActive, joinedAt: p.joinedAt }; }
function toRound(r) { return { id: r._id, roomId: r.roomId, roundNumber: r.roundNumber, imposterId: r.imposterId, word: r.word, decoyWord: r.decoyWord, category: r.category, votes: r.votes || {}, votedOutId: r.votedOutId, imposterWon: r.imposterWon, nextImposterId: r.nextImposterId, status: r.status, createdAt: r.createdAt }; }

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const db = await getDb();
    const code = (req.query.code || "").toUpperCase();
    if (!code) return res.status(400).json({ error: "Code required" });

    const room = await db.collection("rooms").findOne({ code });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const players = await db.collection("players").find({ roomId: room._id }).sort({ joinedAt: 1 }).toArray();

    let round = null;
    if (room.currentRoundId) {
      round = await db.collection("rounds").findOne({ _id: room.currentRoundId });
    }

    return res.status(200).json({
      room: toRoom(room),
      players: players.map(toPlayer),
      round: round ? toRound(round) : null,
    });
  } catch (e) {
    console.error("poll error:", e);
    res.status(500).json({ error: e.message });
  }
};
