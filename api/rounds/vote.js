"use strict";
const { getDb } = require("../_db");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const db = await getDb();
    const { roundId, voterId, targetId } = req.body;
    const round = await db.collection("rounds").findOne({ _id: roundId });
    if (!round || round.status !== "voting") return res.status(400).json({ error: "Not in voting phase" });
    await db.collection("rounds").updateOne({ _id: roundId }, { $set: { [`votes.${voterId}`]: targetId } });
    return res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
