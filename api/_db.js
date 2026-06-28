// api/_db.js — shared MongoDB connection (cached across Vercel function warm invocations)
const { MongoClient } = require("mongodb");

const MONGO_URL =
  process.env.MONGO_URL ||
  "mongodb+srv://xaayux:xaayux@cluster0.mojpz.mongodb.net/?appName=Cluster0/";

let client;
let db;

async function getDb() {
  if (db) return db;
  if (!client) {
    client = new MongoClient(MONGO_URL, { maxPoolSize: 5 });
    await client.connect();
  }
  db = client.db("imposter_party");

  // Ensure indexes (idempotent)
  await db.collection("rooms").createIndex({ code: 1 }, { unique: true });
  await db.collection("players").createIndex({ roomId: 1 });
  await db.collection("rounds").createIndex({ roomId: 1 });

  // Seed word pairs if empty
  const count = await db.collection("wordPairs").countDocuments();
  if (count === 0) {
    await db.collection("wordPairs").insertMany(WORD_PAIRS);
  }

  return db;
}

module.exports = { getDb };

// ── Word pairs library ─────────────────────────────────────────────────────
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
  { word: "Titanic", decoy: "The Poseidon Adventure", category: "Movies" },
  { word: "Superman", decoy: "Batman", category: "Superheroes" },
  { word: "WhatsApp", decoy: "Telegram", category: "Apps" },
  { word: "Instagram", decoy: "TikTok", category: "Social Media" },
  { word: "Amazon", decoy: "eBay", category: "Shopping" },
  { word: "Minecraft", decoy: "Roblox", category: "Games" },
  { word: "Coca-Cola", decoy: "Pepsi", category: "Drinks" },
  { word: "Rolls-Royce", decoy: "Bentley", category: "Cars" },
  { word: "English", decoy: "Spanish", category: "Languages" },
  { word: "Polar Bear", decoy: "Grizzly Bear", category: "Animals" },
  { word: "Champagne", decoy: "Prosecco", category: "Drinks" },
  { word: "Cricket", decoy: "Baseball", category: "Sports" },
  { word: "Passport", decoy: "ID Card", category: "Documents" },
  { word: "Gold", decoy: "Silver", category: "Metals" },
  { word: "Piano", decoy: "Keyboard", category: "Instruments" },
  { word: "Umbrella", decoy: "Raincoat", category: "Accessories" },
  { word: "Helicopter", decoy: "Drone", category: "Aircraft" },
  { word: "King", decoy: "Emperor", category: "Royalty" },
];
