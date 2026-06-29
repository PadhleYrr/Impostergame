import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Plus, LogIn, Shuffle, BarChart2, X } from "lucide-react";
import { AVATARS, COLORS, getIdentity, saveIdentity, setPlayerId, getStats } from "../lib/player";
import { api } from "../lib/api";
import { toast } from "../components/Toaster";

export default function Landing() {
  const nav = useNavigate();
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const id = getIdentity();
    if (id) { setNickname(id.nickname); setAvatar(id.avatar); setColor(id.color); }
    else {
      setAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
  }, []);

  const shuffleAvatar = () => {
    const next = AVATARS[(AVATARS.indexOf(avatar) + 1) % AVATARS.length];
    setAvatar(next);
  };

  const persist = () => {
    if (!nickname.trim()) { toast.error("Pick a nickname first!"); return null; }
    return saveIdentity(nickname, avatar, color);
  };

  const onCreate = async () => {
    const id = persist(); if (!id) return;
    setLoading("create");
    try {
      const { room, player } = await api.createRoom(id.nickname, id.avatar, id.color);
      setPlayerId(room.code, player.id);
      nav(`/room/${room.code}`, { state: { playerId: player.id } });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create room");
    } finally { setLoading(null); }
  };

  const onJoin = async () => {
    const id = persist(); if (!id) return;
    if (code.trim().length < 4) { toast.error("Enter a valid room code"); return; }
    setLoading("join");
    try {
      const { room, player } = await api.joinRoom(code.trim(), id.nickname, id.avatar, id.color);
      setPlayerId(room.code, player.id);
      nav(`/room/${room.code}`, { state: { playerId: player.id } });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Room not found");
    } finally { setLoading(null); }
  };

  const stats = getStats();

  return (
    <div className="min-h-screen flex flex-col px-5 pt-8 pb-16 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Party Game
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-purple-300 hover:bg-white/10 transition active:scale-90"
        >
          <BarChart2 className="w-4 h-4" />
        </button>
      </div>

      {/* Stats panel */}
      {showStats && (
        <div className="bg-card-grad border-soft rounded-2xl p-4 mb-5 shadow-card animate-floatIn">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-300">Your Stats</p>
            <button onClick={() => setShowStats(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4"/></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Games", value: stats.gamesPlayed },
              { label: "Wins", value: stats.wins },
              { label: "Score", value: stats.totalScore },
              { label: "As Imposter", value: stats.timesImposter },
              { label: "Caught", value: stats.timesImposterCaught },
              { label: "Win Rate", value: stats.gamesPlayed ? `${Math.round(stats.wins/stats.gamesPlayed*100)}%` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl p-2 text-center">
                <div className="font-display font-bold text-lg text-party">{value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="text-center mb-8 animate-floatIn">
        <h1 className="font-display text-5xl font-bold leading-[1.05]">
          Find the<br />
          <span className="text-party">Imposter</span>
        </h1>
        <p className="text-white/50 mt-3 text-sm">
          The viral word game — play with your crew, online.
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-card-grad border-soft rounded-3xl p-5 shadow-card mb-4 animate-floatIn" style={{ animationDelay: "0.05s" }}>
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-3">Your Profile</p>
        <div className="flex items-center gap-4">
          <button
            onClick={shuffleAvatar}
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition active:scale-90"
            style={{ background: `${color}22`, boxShadow: `inset 0 0 0 2px ${color}` }}
            title="Tap to change avatar"
          >
            {avatar}
            <span className="absolute -bottom-1.5 -right-1.5 bg-[#161228] rounded-full p-1 border border-white/10">
              <Shuffle className="w-3 h-3 text-white/60" />
            </span>
          </button>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCreate()}
            placeholder="Your nickname…"
            maxLength={16}
            className="flex-1 bg-transparent text-xl font-semibold outline-none placeholder:text-white/20 text-white"
          />
        </div>

        {/* Color picker */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition active:scale-90 shrink-0"
              style={{
                background: c,
                outline: color === c ? `3px solid ${c}` : "2px solid transparent",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Create room */}
      <button
        onClick={onCreate}
        disabled={loading !== null}
        className="bg-party text-white font-bold rounded-2xl py-4 px-5 flex items-center justify-center gap-2 shadow-neon active:scale-[0.98] transition disabled:opacity-50 mb-3 animate-floatIn"
        style={{ animationDelay: "0.1s" }}
      >
        <Plus className="w-5 h-5" />
        {loading === "create" ? "Creating room…" : "Create new room"}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/30 uppercase tracking-widest">or join</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Join room */}
      <div className="bg-card-grad border-soft rounded-2xl p-4 shadow-card animate-floatIn" style={{ animationDelay: "0.15s" }}>
        <label className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
          Room Code
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && onJoin()}
          placeholder="ABCD2"
          maxLength={5}
          className="w-full bg-transparent text-3xl font-display font-bold tracking-[0.4em] py-2 outline-none placeholder:text-white/15 text-white"
        />
        <button
          onClick={onJoin}
          disabled={loading !== null}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-3 mt-2 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          {loading === "join" ? "Joining…" : "Join room"}
        </button>
      </div>

      {/* Game mode preview */}
      <div className="mt-6 animate-floatIn" style={{ animationDelay: "0.2s" }}>
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-3 text-center">Game Modes</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { emoji: "🎭", name: "Classic", desc: "Find the imposter" },
            { emoji: "🃏", name: "Bluff", desc: "Imposter knows & lies" },
            { emoji: "🔗", name: "Chain", desc: "Imposter picks next" },
            { emoji: "💀", name: "Chain + Bluff", desc: "Maximum chaos" },
          ].map((m) => (
            <div key={m.name} className="bg-white/3 border border-white/5 rounded-xl p-3">
              <div className="text-xl mb-1">{m.emoji}</div>
              <div className="text-xs font-bold text-white/80">{m.name}</div>
              <div className="text-[10px] text-white/35 mt-0.5">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-white/25 mt-auto pt-8">
        Best with 3–10 friends · No signup needed
      </p>
    </div>
  );
}
