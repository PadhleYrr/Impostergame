// api/rounds/tally.js
const { getDb } = require("../_db");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const db = await getDb();
    const { roundId } = req.body;

    const round = await db.collection("rounds").findOne({ _id: roundId });
    if (!round) return res.status(404).json({ error: "Round not found" });

    const players = await db.collection("players").find({ roomId: round.roomId }).toArray();

    // Tally votes
    const counts = {};
    for (const target of Object.values(round.votes || {})) {
      counts[target] = (counts[target] || 0) + 1;
    }

    let topId = null;
    let topCount = 0;
    let tied = false;
    for (const [pid, c] of Object.entries(counts)) {
      if (c > topCount) { topCount = c; topId = pid; tied = false; }
      else if (c === topCount) { tied = true; }
    }

    const votedOutId = tied ? null : topId;
    const imposterCaught = votedOutId === round.imposterId;
    const imposterWon = !imposterCaught;

    // Update scores
    for (const p of players) {
      let delta = 0;
      if (p._id === round.imposterId && imposterWon) delta = 3;
      if (p._id !== round.imposterId && imposterCaught) delta = 1;
      if (p._id !== round.imposterId && round.votes?.[p._id] === round.imposterId) delta += 1;
      if (delta > 0) {
        await db.collection("players").updateOne({ _id: p._id }, { $inc: { score: delta } });
      }
    }

    await db.collection("rounds").updateOne(
      { _id: roundId },
      { $set: { status: "results", votedOutId, imposterWon } }
    );

    res.status(200).json({ ok: true, imposterWon, votedOutId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
