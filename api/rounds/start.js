"use strict";
const { getDb } = require("../_db");

function uuid() { return crypto.randomUUID(); }

function toRound(r) {
  return { id: r._id, roomId: r.roomId, roundNumber: r.roundNumber, imposterId: r.imposterId, word: r.word, decoyWord: r.decoyWord, category: r.category, votes: r.votes || {}, votedOutId: r.votedOutId, imposterWon: r.imposterWon, nextImposterId: r.nextImposterId, status: r.status, createdAt: r.createdAt };
}

// Fisher-Yates shuffle using crypto random for true randomness
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const db = await getDb();
    const { roomId, forceImposterId } = req.body;

    const room = await db.collection("rooms").findOne({ _id: roomId });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const players = await db.collection("players").find({ roomId, isActive: true }).toArray();
    if (players.length < 3) return res.status(400).json({ error: "Need at least 3 players" });

    // Pick a random word pair — also shuffle pairs before picking
    const pairs = await db.collection("wordPairs").find({}).toArray();
    const shuffledPairs = shuffle(pairs);
    const pair = shuffledPairs[Math.floor(Math.random() * shuffledPairs.length)];

    // Pick imposter from a shuffled player list to avoid insertion-order bias
    let imposter;
    if (forceImposterId && players.find((p) => p._id === forceImposterId)) {
      imposter = players.find((p) => p._id === forceImposterId);
    } else {
      const shuffled = shuffle(players);
      // Also use a crypto-strong random index on top of shuffling
      const idx = Math.floor(Math.random() * shuffled.length);
      imposter = shuffled[idx];
      console.log(`Selected imposter: ${imposter.nickname} (index ${idx} of ${shuffled.length} shuffled players)`);
    }

    const roundId = uuid();
    const round = {
      _id: roundId,
      roomId,
      roundNumber: room.currentRound + 1,
      imposterId: imposter._id,
      word: pair.word,
      decoyWord: pair.decoy,
      category: pair.category,
      votes: {},
      votedOutId: null,
      imposterWon: null,
      nextImposterId: null,
      status: "reveal",
      createdAt: new Date().toISOString(),
    };

    await db.collection("rounds").insertOne(round);
    await db.collection("rooms").updateOne(
      { _id: roomId },
      { $set: { status: "playing", currentRound: round.roundNumber, currentRoundId: roundId } }
    );

    return res.status(200).json({ round: toRound(round) });
  } catch (e) {
    console.error("start round error:", e);
    res.status(500).json({ error: e.message });
  }
};
