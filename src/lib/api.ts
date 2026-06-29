// src/lib/api.ts — typed wrappers around all /api/* endpoints

export type GameMode = "classic" | "bluff" | "chain" | "chain_bluff";
export type RoomStatus = "lobby" | "playing" | "ended";
export type RoundStatus = "reveal" | "voting" | "results";

export interface Room {
  id: string;
  code: string;
  hostId: string;
  mode: GameMode;
  status: RoomStatus;
  currentRound: number;
  currentRoundId: string | null;
  createdAt: string;
}

export interface Player {
  id: string;
  roomId: string;
  nickname: string;
  avatar: string;
  color: string;
  score: number;
  isActive: boolean;
  joinedAt: string;
}

export interface Round {
  id: string;
  roomId: string;
  roundNumber: number;
  imposterId: string;
  word: string;
  decoyWord: string;
  category: string | null;
  votes: Record<string, string>;
  votedOutId: string | null;
  imposterWon: boolean | null;
  nextImposterId: string | null;
  status: RoundStatus;
  createdAt: string;
}

export interface RoomState {
  room: Room;
  players: Player[];
  round: Round | null;
}

async function apiFetch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body !== undefined ? "POST" : "GET",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const api = {
  createRoom: (nickname: string, avatar: string, color: string) =>
    apiFetch<{ room: Room; player: Player }>("/api/rooms/create", { nickname, avatar, color }),

  joinRoom: (code: string, nickname: string, avatar: string, color: string) =>
    apiFetch<{ room: Room; player: Player }>("/api/rooms/join", { code, nickname, avatar, color }),

  pollRoom: (code: string, playerId: string) =>
    apiFetch<RoomState>(`/api/rooms/${code}?playerId=${encodeURIComponent(playerId)}`),

  setMode: (roomId: string, mode: GameMode) =>
    apiFetch("/api/rooms/mode", { roomId, mode }),

  startRound: (roomId: string, forceImposterId?: string | null) =>
    apiFetch<{ round: Round }>("/api/rounds/start", { roomId, forceImposterId: forceImposterId ?? null }),

  moveToVoting: (roundId: string) =>
    apiFetch("/api/rounds/voting", { roundId }),

  castVote: (roundId: string, voterId: string, targetId: string) =>
    apiFetch("/api/rounds/vote", { roundId, voterId, targetId }),

  tallyRound: (roundId: string) =>
    apiFetch("/api/rounds/tally", { roundId }),

  chainPickNext: (roundId: string, nextImposterId: string) =>
    apiFetch("/api/rounds/chain", { roundId, nextImposterId }),

  leaveRoom: (playerId: string) =>
    apiFetch("/api/players/leave", { playerId }),
};

// ── Mode metadata ──────────────────────────────────────────────────────────
export const MODE_LABEL: Record<GameMode, string> = {
  classic: "Classic",
  bluff: "Imposter + Bluff",
  chain: "Chain Imposter",
  chain_bluff: "Chain + Bluff",
};

export const MODE_DESCRIPTION: Record<GameMode, string> = {
  classic: "Everyone gets a word. The imposter gets a similar decoy — they don't know they're the imposter.",
  bluff: "Imposter knows they're the imposter AND sees the real word. They must blend in with lies.",
  chain: "After each round the imposter secretly picks who's next. Paranoia builds.",
  chain_bluff: "Imposter knows + picks the next imposter. Maximum chaos.",
};

export const MODE_EMOJI: Record<GameMode, string> = {
  classic: "🎭",
  bluff: "🃏",
  chain: "🔗",
  chain_bluff: "💀",
};
