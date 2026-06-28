// api/players/leave.js
const { getDb } = require("../_db");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const db = await getDb();
    const { playerId } = req.body;
    await db.collection("players").deleteOne({ _id: playerId });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
