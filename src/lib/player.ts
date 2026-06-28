// src/lib/player.ts — local identity (no auth required)

export const AVATARS = ["🎭","👻","🦊","🐼","🐸","🦁","🐯","🦄","🐙","🦖","👽","🤖","🧙","🧛","🥷","🦸","🐉","🧟","🦝","🦋"];
export const COLORS = ["#ec4899","#7c3aed","#fbbf24","#22d3ee","#34d399","#f97316","#a78bfa","#f43f5e","#06b6d4","#84cc16"];

export interface Identity {
  nickname: string;
  avatar: string;
  color: string;
}

const KEY = "imposter_identity_v2";

export function getIdentity(): Identity | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function saveIdentity(nickname: string, avatar: string, color: string): Identity {
  const id: Identity = {
    nickname: nickname.trim().slice(0, 16),
    avatar,
    color,
  };
  localStorage.setItem(KEY, JSON.stringify(id));
  return id;
}

const PID_PREFIX = "imposter_pid_";
export const getPlayerId = (code: string) => localStorage.getItem(PID_PREFIX + code);
export const setPlayerId = (code: string, id: string) => localStorage.setItem(PID_PREFIX + code, id);
export const clearPlayerId = (code: string) => localStorage.removeItem(PID_PREFIX + code);

// Stats tracking
const STATS_KEY = "imposter_stats_v1";
export interface Stats {
  gamesPlayed: number;
  wins: number;
  timesImposter: number;
  timesImposterCaught: number;
  totalScore: number;
}
export function getStats(): Stats {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || "null") || defaultStats(); }
  catch { return defaultStats(); }
}
function defaultStats(): Stats {
  return { gamesPlayed: 0, wins: 0, timesImposter: 0, timesImposterCaught: 0, totalScore: 0 };
}
export function recordRound(wasImposter: boolean, won: boolean, scoreDelta: number) {
  const s = getStats();
  s.gamesPlayed++;
  if (won) s.wins++;
  if (wasImposter) s.timesImposter++;
  if (wasImposter && !won) s.timesImposterCaught++;
  s.totalScore += scoreDelta;
  localStorage.setItem(STATS_KEY, JSON.stringify(s));
}
