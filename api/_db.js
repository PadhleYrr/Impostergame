// api/_db.js — shared MongoDB connection cached across warm Vercel invocations
"use strict";

const { MongoClient } = require("mongodb");

const MONGO_URL =
  process.env.MONGO_URL ||
  "mongodb+srv://xaayux:xaayux@cluster0.mojpz.mongodb.net/?appName=Cluster0/";

let _client = null;
let _db = null;

async function getDb() {
  if (_db) return _db;
  if (!_client) {
    _client = new MongoClient(MONGO_URL, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 });
    await _client.connect();
  }
  _db = _client.db("imposter_party");

  // Idempotent indexes
  await _db.collection("rooms").createIndex({ code: 1 }, { unique: true });
  await _db.collection("players").createIndex({ roomId: 1 });
  await _db.collection("rounds").createIndex({ roomId: 1 });

  // Seed word pairs once
  const count = await _db.collection("wordPairs").countDocuments();
  if (count === 0) {
    await _db.collection("wordPairs").insertMany(WORD_PAIRS);
    console.log("Seeded", WORD_PAIRS.length, "word pairs");
  }

  return _db;
}

module.exports = { getDb };

// ── Word pairs ─────────────────────────────────────────────────────────────
const WORD_PAIRS = [
  { word: "Coffee", decoy: "Tea", category: "Drinks" },
  { word: "Pizza", decoy: "Flatbread", category: "Food" },
  { word: "Lion", decoy: "Tiger", category: "Animals" },
  { word: "Guitar", decoy: "Ukulele", category: "Instruments" },
  { word: "Paris", decoy: "Lyon", category: "Cities" },
  { word: "Netflix", decoy: "Hulu", category: "Streaming" },
  { word: "iPhone", decoy: "Android", category: "Phones" },
  { word: "Nike", decoy: "Adidas", category: "Brands" },
  { word: "Sushi", decoy: "Sashimi", category: "Food" },
  { word: "Basketball", decoy: "Volleyball", category: "Sports" },
  { word: "Doctor", decoy: "Nurse", category: "Jobs" },
  { word: "Summer", decoy: "Spring", category: "Seasons" },
  { word: "Diamond", decoy: "Ruby", category: "Gems" },
  { word: "Violin", decoy: "Viola", category: "Instruments" },
  { word: "Chocolate", decoy: "Vanilla", category: "Flavours" },
  { word: "Shark", decoy: "Dolphin", category: "Sea Animals" },
  { word: "Astronaut", decoy: "Pilot", category: "Jobs" },
  { word: "Football", decoy: "Rugby", category: "Sports" },
  { word: "Laptop", decoy: "Tablet", category: "Devices" },
  { word: "Tokyo", decoy: "Osaka", category: "Cities" },
  { word: "Harry Potter", decoy: "Fantastic Beasts", category: "Movies" },
  { word: "McDonald's", decoy: "Burger King", category: "Fast Food" },
  { word: "Superman", decoy: "Batman", category: "Superheroes" },
  { word: "WhatsApp", decoy: "Telegram", category: "Apps" },
  { word: "Instagram", decoy: "TikTok", category: "Social Media" },
  { word: "Amazon", decoy: "eBay", category: "Shopping" },
  { word: "Minecraft", decoy: "Roblox", category: "Games" },
  { word: "Coca-Cola", decoy: "Pepsi", category: "Drinks" },
  { word: "Rolls-Royce", decoy: "Bentley", category: "Cars" },
  { word: "Cricket", decoy: "Baseball", category: "Sports" },
  { word: "Gold", decoy: "Silver", category: "Metals" },
  { word: "Piano", decoy: "Keyboard", category: "Instruments" },
  { word: "Umbrella", decoy: "Raincoat", category: "Accessories" },
  { word: "Helicopter", decoy: "Drone", category: "Aircraft" },
  { word: "Chocolate Cake", decoy: "Brownie", category: "Desserts" },
  { word: "Sunglasses", decoy: "Goggles", category: "Accessories" },
  { word: "Skyscraper", decoy: "Tower", category: "Buildings" },
  { word: "Penguin", decoy: "Puffin", category: "Birds" },
  { word: "Hamburger", decoy: "Cheeseburger", category: "Food" },
  { word: "Violin", decoy: "Cello", category: "Instruments" },
];
