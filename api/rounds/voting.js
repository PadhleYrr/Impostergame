// api/rounds/voting.js
const { getDb } = require("../_db");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const db = await getDb();
    const { roundId } = req.body;
    await db.collection("rounds").updateOne({ _id: roundId }, { $set: { status: "voting" } });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
