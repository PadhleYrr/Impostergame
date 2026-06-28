import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Copy, Crown, Eye, EyeOff, LogOut, Play, RotateCcw,
  Skull, Trophy, Users, Vote, Sparkles, CheckCircle2,
} from "lucide-react";
import { api, type GameMode, type Player, type Room, type Round, MODE_LABEL, MODE_DESCRIPTION, MODE_EMOJI } from "../lib/api";
import { getPlayerId, clearPlayerId, recordRound } from "../lib/player";
import { toast } from "../components/Toaster";

const MODES: GameMode[] = ["classic", "bluff", "chain", "chain_bluff"];
const POLL_MS = 1800;

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [me, setMe] = useState<Player | null>(null);
  const [missing, setMissing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const myId = getPlayerId(code!);

  useEffect(() => {
    if (!myId) { nav("/"); return; }
    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [code]);

  async function poll() {
    try {
      const state = await api.pollRoom(code!);
      setRoom(state.room);
      setPlayers(state.players);
      setRound(state.round);
      const mine = state.players.find((p) => p.id === myId) ?? null;
      if (!mine) { clearPlayerId(code!); nav("/"); return; }
      setMe(mine);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("not found")) setMissing(true);
    }
  }

  const onLeave = async () => {
    if (me) await api.leaveRoom(me.id);
    clearPlayerId(code!);
    if (pollRef.current) clearInterval(pollRef.current);
    nav("/");
  };

  if (missing) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">🕵️</div>
      <h1 className="font-display text-3xl font-bold">Room not found</h1>
      <p className="text-white/50 mt-2">Check the code and try again.</p>
      <button onClick={() => nav("/")} className="bg-party text-white px-6 py-3 rounded-xl mt-6 font-bold shadow-neon">
        Back home
      </button>
    </div>
  );

  if (!room || !me) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
    </div>
  );

  const isHost = room.hostId === me.id;

  return (
    <div className="min-h-screen max-w-md mx-auto px-5 pt-6 pb-12 flex flex-col">
      <RoomHeader room={room} me={me} onLeave={onLeave} />

      {room.status === "lobby" && (
        <LobbyView room={room} players={players} me={me} isHost={isHost} onRefresh={poll} />
      )}

      {room.status === "playing" && round && (
        <GameView room={room} players={players} me={me} round={round} isHost={isHost} onRefresh={poll} />
      )}

      {room.status === "ended" && (
        <EndedView players={players} me={me} onHome={() => { clearPlayerId(code!); nav("/"); }} />
      )}

      <Leaderboard players={players} meId={me.id} />
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────
function RoomHeader({ room, me, onLeave }: { room: Room; me: Player; onLeave: () => void }) {
  const copy = () => { navigator.clipboard.writeText(room.code); toast.success("Room code copied!"); };
  return (
    <div className="flex items-center justify-between mb-5">
      <button onClick={copy} className="flex items-center gap-2 group">
        <div className="bg-card-grad border-soft rounded-xl px-3 py-1.5 shadow-card">
          <div className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">Room</div>
          <div className="font-display text-xl font-bold tracking-[0.3em] leading-none text-white">{room.code}</div>
        </div>
        <Copy className="w-4 h-4 text-white/30 group-active:scale-90 transition" />
      </button>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">You</div>
          <div className="font-semibold flex items-center gap-1 text-sm leading-none">
            <span>{me.avatar}</span> <span>{me.nickname}</span>
          </div>
        </div>
        <button
          onClick={onLeave}
          className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center active:scale-90 transition"
        >
          <LogOut className="w-4 h-4 text-white/60" />
        </button>
      </div>
    </div>
  );
}

// ── Lobby ──────────────────────────────────────────────────────────────────
function LobbyView({ room, players, me, isHost, onRefresh }: {
  room: Room; players: Player[]; me: Player; isHost: boolean; onRefresh: () => void;
}) {
  const [starting, setStarting] = useState(false);
  const canStart = players.length >= 3;
  const shareLink = `${window.location.origin}/room/${room.code}`;

  const onStart = async () => {
    if (!canStart) { toast.error("Need at least 3 players"); return; }
    setStarting(true);
    try { await api.startRound(room.id); await onRefresh(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed to start"); }
    finally { setStarting(false); }
  };

  const onMode = async (m: GameMode) => {
    if (!isHost) return;
    try { await api.setMode(room.id, m); await onRefresh(); }
    catch { toast.error("Failed to change mode"); }
  };

  const copyLink = () => { navigator.clipboard.writeText(shareLink); toast.success("Invite link copied!"); };

  return (
    <div className="animate-floatIn flex-1">
      {/* Invite banner */}
      <button
        onClick={copyLink}
        className="w-full bg-purple-500/10 border border-purple-500/25 rounded-2xl px-4 py-3 flex items-center gap-3 mb-5 active:scale-[0.98] transition"
      >
        <span className="text-xl">🔗</span>
        <div className="text-left flex-1 min-w-0">
          <div className="text-xs font-bold text-purple-300">Invite friends</div>
          <div className="text-[11px] text-white/40 truncate">{shareLink}</div>
        </div>
        <Copy className="w-4 h-4 text-purple-300 shrink-0" />
      </button>

      {/* Mode selector */}
      <div className="bg-card-grad border-soft rounded-3xl p-5 shadow-card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Game Mode</span>
          {!isHost && <span className="text-[10px] text-white/25 ml-auto">Only host can change</span>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => {
            const active = room.mode === m;
            return (
              <button
                key={m}
                disabled={!isHost}
                onClick={() => onMode(m)}
                className={`text-left rounded-2xl border p-3 transition active:scale-[0.97] ${
                  active
                    ? "bg-party shadow-neon border-transparent text-white"
                    : "bg-white/4 border-white/8 hover:bg-white/8 disabled:opacity-60 text-white/70"
                }`}
              >
                <div className="text-lg mb-0.5">{MODE_EMOJI[m]}</div>
                <div className="text-xs font-bold leading-tight">{MODE_LABEL[m]}</div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-white/40 mt-3 leading-relaxed">{MODE_DESCRIPTION[room.mode]}</p>
      </div>

      {/* Players */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-white/30" />
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
            Players · {players.length}
          </span>
        </div>
        {!canStart && (
          <span className="text-xs text-yellow-400">Need {3 - players.length} more</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {players.map((p) => (
          <PlayerChip key={p.id} player={p} isHost={p.id === room.hostId} isMe={p.id === me.id} />
        ))}
      </div>

      {isHost ? (
        <button
          onClick={onStart}
          disabled={!canStart || starting}
          className="w-full bg-party text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-neon active:scale-[0.98] transition disabled:opacity-50"
        >
          <Play className="w-5 h-5" />
          {starting ? "Starting…" : `Start Round ${room.currentRound + 1}`}
        </button>
      ) : (
        <div className="text-center text-sm text-white/30 py-4 animate-pulse">
          Waiting for host to start…
        </div>
      )}
    </div>
  );
}

// ── Game view dispatcher ───────────────────────────────────────────────────
function GameView({ room, players, me, round, isHost, onRefresh }: {
  room: Room; players: Player[]; me: Player; round: Round; isHost: boolean; onRefresh: () => void;
}) {
  if (round.status === "reveal") return <RevealView room={room} me={me} round={round} isHost={isHost} onRefresh={onRefresh} />;
  if (round.status === "voting") return <VotingView players={players} me={me} round={round} isHost={isHost} onRefresh={onRefresh} />;
  return <ResultsView room={room} players={players} me={me} round={round} isHost={isHost} onRefresh={onRefresh} />;
}

// ── Reveal ─────────────────────────────────────────────────────────────────
function RevealView({ room, me, round, isHost, onRefresh }: {
  room: Room; me: Player; round: Round; isHost: boolean; onRefresh: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const isImposter = round.imposterId === me.id;
  const isBluffMode = room.mode === "bluff" || room.mode === "chain_bluff";
  const isChainMode = room.mode === "chain" || room.mode === "chain_bluff";
  const knowsTheyreImposter = isImposter && (isBluffMode || isChainMode);
  const displayWord = isImposter
    ? isBluffMode ? round.word : round.decoyWord
    : round.word;

  const onVoting = async () => {
    setBusy(true);
    try { await api.moveToVoting(round.id); await onRefresh(); }
    catch { toast.error("Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="animate-floatIn flex-1 flex flex-col">
      <div className="text-center mb-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
          Round {round.roundNumber} · {round.category}
        </div>
        <div className="font-display text-2xl font-bold mt-1 text-white">Your secret</div>
      </div>

      <button
        onClick={() => setShown((s) => !s)}
        className={`relative w-full rounded-3xl border shadow-card overflow-hidden transition-all active:scale-[0.99] flex-1 max-h-[340px] ${
          shown
            ? isImposter ? "border-red-500/40" : "border-white/10"
            : "border-white/8"
        } ${shown && isImposter ? "bg-gradient-to-br from-red-900/60 to-pink-900/60" : "bg-card-grad"}`}
      >
        {!shown ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            <div className="w-20 h-20 rounded-3xl bg-party flex items-center justify-center text-4xl shadow-neon animate-pulseGlow">🎴</div>
            <div className="font-display text-2xl font-bold text-white">Tap to reveal</div>
            <p className="text-xs text-white/40 text-center max-w-[200px]">
              Hide your screen from others first 👀
            </p>
            <div className="flex items-center gap-1 text-xs text-white/30 mt-2">
              <Eye className="w-3.5 h-3.5" /> Tap when ready
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6">
            {knowsTheyreImposter ? (
              <>
                <div className="text-xs uppercase tracking-[0.3em] text-white/60 font-bold">You are the</div>
                <div className="font-display text-5xl font-bold text-white drop-shadow-lg">IMPOSTER</div>
                {isBluffMode ? (
                  <>
                    <p className="text-xs text-white/60 mt-2">Real word everyone got:</p>
                    <div className="text-2xl font-bold text-white">{round.word}</div>
                    <p className="text-[11px] text-white/50 text-center mt-1 max-w-[220px]">
                      You know the real word — blend in. Lie convincingly 😈
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-white/60 mt-1">Your decoy word:</div>
                    <div className="font-display text-3xl font-bold text-pink-300">{round.decoyWord}</div>
                    <p className="text-[11px] text-white/50 text-center mt-1 max-w-[220px]">
                      You got a different word. Don't get caught!
                    </p>
                  </>
                )}
              </>
            ) : isImposter ? (
              <>
                <div className="text-xs uppercase tracking-[0.3em] text-white/60 font-bold">Your word</div>
                <div className="font-display text-5xl font-bold text-pink-300 text-center leading-tight">{displayWord}</div>
                <p className="text-[11px] text-white/50 text-center mt-3 max-w-[220px]">
                  You're the imposter but you don't know it 😅
                </p>
              </>
            ) : (
              <>
                <div className="text-xs uppercase tracking-[0.3em] text-white/50 font-bold">Your word</div>
                <div className="font-display text-5xl font-bold text-party text-center leading-tight">{displayWord}</div>
                <p className="text-[11px] text-white/40 text-center mt-3 max-w-[220px]">
                  One person has a different word. Find them!
                </p>
              </>
            )}
            <div className="flex items-center gap-1 text-xs text-white/25 mt-4">
              <EyeOff className="w-3.5 h-3.5" /> Tap to hide
            </div>
          </div>
        )}
      </button>

      <div className="mt-6">
        <p className="text-center text-sm text-white/40 mb-3">
          Discuss IRL. Drop clues. Don't be obvious.
        </p>
        {isHost ? (
          <button
            onClick={onVoting}
            disabled={busy}
            className="w-full bg-party text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-neon active:scale-[0.98] disabled:opacity-50"
          >
            <Vote className="w-5 h-5" /> {busy ? "…" : "Start voting"}
          </button>
        ) : (
          <div className="text-center text-xs text-white/25">
            Host moves to voting when ready
          </div>
        )}
      </div>
    </div>
  );
}

// ── Voting ─────────────────────────────────────────────────────────────────
function VotingView({ players, me, round, isHost, onRefresh }: {
  players: Player[]; me: Player; round: Round; isHost: boolean; onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const myVote = round.votes[me.id];
  const voterCount = Object.keys(round.votes).length;

  const onVote = async (targetId: string) => {
    if (targetId === me.id) return;
    try { await api.castVote(round.id, me.id, targetId); await onRefresh(); }
    catch { toast.error("Failed to cast vote"); }
  };

  const onTally = async () => {
    setBusy(true);
    try { await api.tallyRound(round.id); await onRefresh(); }
    catch { toast.error("Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="animate-floatIn flex-1">
      <div className="text-center mb-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
          Round {round.roundNumber} · Voting
        </div>
        <div className="font-display text-2xl font-bold mt-1 text-white">Who's the imposter?</div>
        <div className="text-xs text-white/40 mt-1">
          {voterCount}/{players.length} voted
        </div>
      </div>

      {/* Vote progress bar */}
      <div className="h-1 bg-white/10 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-party rounded-full transition-all duration-500"
          style={{ width: `${players.length ? (voterCount / players.length) * 100 : 0}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {players.map((p) => {
          const isSelf = p.id === me.id;
          const selected = myVote === p.id;
          const voteCount = Object.values(round.votes).filter((v) => v === p.id).length;
          return (
            <button
              key={p.id}
              disabled={isSelf}
              onClick={() => onVote(p.id)}
              className={`relative rounded-2xl border p-3 flex items-center gap-3 transition active:scale-[0.97] ${
                selected
                  ? "bg-party border-transparent shadow-neon text-white"
                  : isSelf
                  ? "opacity-40 border-white/10 bg-white/3"
                  : "border-white/10 bg-white/4 hover:bg-white/8 text-white"
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: `${p.color}22`, boxShadow: `inset 0 0 0 2px ${p.color}` }}
              >
                {p.avatar}
              </div>
              <div className="text-sm font-semibold truncate text-left flex-1">{p.nickname}</div>
              {selected && <CheckCircle2 className="w-4 h-4 shrink-0 text-white/80" />}
              {voteCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white rounded-full text-[10px] font-bold w-5 h-5 flex items-center justify-center">
                  {voteCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isHost ? (
        <button
          onClick={onTally}
          disabled={busy}
          className="w-full bg-party text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-neon active:scale-[0.98] disabled:opacity-50"
        >
          <Skull className="w-5 h-5" /> {busy ? "Tallying…" : "Reveal results"}
        </button>
      ) : (
        <div className="text-center text-xs text-white/25">
          Host reveals results when ready
        </div>
      )}
    </div>
  );
}

// ── Results ────────────────────────────────────────────────────────────────
function ResultsView({ room, players, me, round, isHost, onRefresh }: {
  room: Room; players: Player[]; me: Player; round: Round; isHost: boolean; onRefresh: () => void;
}) {
  const [starting, setStarting] = useState(false);
  const imposter = players.find((p) => p.id === round.imposterId);
  const votedOut = players.find((p) => p.id === round.votedOutId);
  const isImposter = me.id === round.imposterId;
  const isChain = room.mode === "chain" || room.mode === "chain_bluff";
  const needsChainPick = isChain && isImposter && !round.nextImposterId;
  const [chainPicked, setChainPicked] = useState<string | null>(round.nextImposterId);

  // Record stats on first render
  const statsRecorded = useRef(false);
  useEffect(() => {
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    const won = isImposter ? !!round.imposterWon : !round.imposterWon;
    const mePlayer = players.find((p) => p.id === me.id);
    recordRound(isImposter, won, mePlayer?.score ?? 0);
  }, []);

  const onNext = async () => {
    setStarting(true);
    try {
      await api.startRound(room.id, isChain ? round.nextImposterId : null);
      await onRefresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setStarting(false); }
  };

  const onChainPick = async (targetId: string) => {
    setChainPicked(targetId);
    try { await api.chainPickNext(round.id, targetId); }
    catch { toast.error("Failed to save pick"); }
  };

  return (
    <div className="animate-floatIn flex-1">
      <div className="text-center mb-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
          Round {round.roundNumber} · Results
        </div>
        <div className={`font-display text-3xl font-bold mt-2 ${round.imposterWon ? "text-yellow-400" : "text-party"}`}>
          {round.imposterWon ? "🃏 Imposter wins!" : "🎉 Crew wins!"}
        </div>
      </div>

      {/* Reveal card */}
      <div className="bg-card-grad border-soft rounded-3xl p-5 shadow-card mb-4 text-center">
        <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-2">
          The imposter was
        </div>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: `${imposter?.color ?? "#ec4899"}22`, boxShadow: `inset 0 0 0 2px ${imposter?.color ?? "#ec4899"}` }}
          >
            {imposter?.avatar}
          </div>
          <div className="font-display text-2xl font-bold text-white">{imposter?.nickname}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-white/30">Real word</div>
            <div className="font-bold text-white mt-0.5">{round.word}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-white/30">Imposter word</div>
            <div className="font-bold text-pink-300 mt-0.5">{round.decoyWord}</div>
          </div>
        </div>
        <div className="text-xs text-white/40 mt-3">
          {votedOut
            ? <>Voted out: <span className="font-semibold text-white">{votedOut.nickname}</span></>
            : "Vote was tied — nobody voted out"}
        </div>
      </div>

      {/* Chain picker (imposter only) */}
      {needsChainPick && (
        <div className="bg-card-grad border-2 border-purple-500/40 rounded-3xl p-4 shadow-card mb-4">
          <div className="text-center mb-3">
            <div className="text-[10px] uppercase tracking-widest text-purple-300 font-bold">🔗 Chain Mode</div>
            <div className="font-display text-lg font-bold mt-1 text-white">Pick the next imposter</div>
            <p className="text-[11px] text-white/40 mt-1">Only you can see this 😈</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {players.filter((p) => p.id !== me.id).map((p) => (
              <button
                key={p.id}
                onClick={() => onChainPick(p.id)}
                className={`rounded-xl p-2.5 border flex items-center gap-2 transition active:scale-95 ${
                  chainPicked === p.id
                    ? "bg-party border-transparent shadow-neon text-white"
                    : "bg-white/5 border-white/10 text-white/70"
                }`}
              >
                <span className="text-lg">{p.avatar}</span>
                <span className="text-xs font-semibold truncate">{p.nickname}</span>
                {chainPicked === p.id && <CheckCircle2 className="w-3.5 h-3.5 ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Waiting for chain pick */}
      {isChain && !isImposter && !round.nextImposterId && (
        <div className="text-center text-xs text-white/30 mb-4 animate-pulse">
          Imposter is secretly picking the next imposter…
        </div>
      )}

      {isHost ? (
        <button
          onClick={onNext}
          disabled={starting || (isChain && !round.nextImposterId)}
          className="w-full bg-party text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-neon active:scale-[0.98] disabled:opacity-50"
        >
          <RotateCcw className="w-5 h-5" />
          {starting ? "Loading…" : "Next round"}
        </button>
      ) : (
        <div className="text-center text-xs text-white/25">
          Waiting for host to start next round…
        </div>
      )}
    </div>
  );
}

// ── Ended ──────────────────────────────────────────────────────────────────
function EndedView({ players, me, onHome }: { players: Player[]; me: Player; onHome: () => void }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  return (
    <div className="animate-floatIn flex-1 text-center">
      <div className="text-5xl mb-3">🏆</div>
      <div className="font-display text-3xl font-bold text-party mb-1">Game Over!</div>
      <p className="text-white/50 text-sm mb-6">
        {winner?.id === me.id ? "You won! 🎉" : `${winner?.nickname} wins!`}
      </p>
      <button onClick={onHome} className="bg-party text-white font-bold rounded-2xl py-4 px-8 shadow-neon active:scale-[0.98]">
        Back to home
      </button>
    </div>
  );
}

// ── Leaderboard ────────────────────────────────────────────────────────────
function Leaderboard({ players, meId }: { players: Player[]; meId: string }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  if (!players.length) return null;
  return (
    <div className="mt-8 pt-6 border-t border-white/8">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Leaderboard</span>
      </div>
      <div className="space-y-1.5">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
              p.id === meId ? "bg-white/8 border border-white/10" : "bg-white/3"
            }`}
          >
            <span className="text-xs font-bold text-white/30 w-5">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>
            <span className="text-lg">{p.avatar}</span>
            <span className="text-sm font-semibold flex-1 truncate text-white/80">{p.nickname}</span>
            <span className="font-display font-bold text-party text-lg">{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Player chip ────────────────────────────────────────────────────────────
function PlayerChip({ player, isHost, isMe }: { player: Player; isHost?: boolean; isMe?: boolean }) {
  return (
    <div className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border bg-white/4 ${isMe ? "border-pink-500/50 ring-1 ring-pink-500/30" : "border-white/8"}`}>
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: `${player.color}22`, boxShadow: `inset 0 0 0 2px ${player.color}` }}
      >
        {player.avatar}
      </div>
      <div className="text-xs font-semibold text-center truncate w-full text-white/80">{player.nickname}</div>
      {isHost && (
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full p-1">
          <Crown className="w-3 h-3" />
        </span>
      )}
    </div>
  );
}
