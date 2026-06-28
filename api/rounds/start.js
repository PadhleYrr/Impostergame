// api/rounds/start.js
const { getDb } = require("../_db");
const { v4: uuid } = require("uuid");

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

    // Pick random word pair
    const pairs = await db.collection("wordPairs").find({}).toArray();
    const pair = pairs[Math.floor(Math.random() * pairs.length)];

    // Pick imposter
    let imposter;
    if (forceImposterId && players.find((p) => p._id === forceImposterId)) {
      imposter = players.find((p) => p._id === forceImposterId);
    } else {
      imposter = players[Math.floor(Math.random() * players.length)];
    }

    const nextRoundNumber = room.currentRound + 1;
    const roundId = uuid();

    const round = {
      _id: roundId,
      roomId,
      roundNumber: nextRoundNumber,
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
      { $set: { status: "playing", currentRound: nextRoundNumber, currentRoundId: roundId } }
    );

    res.status(200).json({ round: mongoToRound(round) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

function mongoToRound(r) {
  return { id: r._id, roomId: r.roomId, roundNumber: r.roundNumber, imposterId: r.imposterId, word: r.word, decoyWord: r.decoyWord, category: r.category, votes: r.votes || {}, votedOutId: r.votedOutId, imposterWon: r.imposterWon, nextImposterId: r.nextImposterId, status: r.status, createdAt: r.createdAt };
}
