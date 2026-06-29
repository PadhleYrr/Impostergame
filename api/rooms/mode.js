"use strict";
const { getDb } = require("../_db");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const db = await getDb();
    const { roomId, mode } = req.body;
    if (!roomId || !mode) return res.status(400).json({ error: "roomId and mode required" });
    await db.collection("rooms").updateOne({ _id: roomId }, { $set: { mode } });
    return res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
