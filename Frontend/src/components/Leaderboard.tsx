import { useEffect, useState } from "react";
import { http } from "../services/http";
import {
  FiAward,
  FiStar,
  FiMessageSquare,
  FiUser,
} from "react-icons/fi";

type LeaderDTO = {
  id: string;
  name: string;
  role: "Tutor" | "Instructor" | "Student";
  points: number;
  answers: number;
};

type LeaderboardResponse = {
  items: LeaderDTO[];
  range?: "This Week" | "This Month" | "All Time";
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
};

const getRankIcon = (idx: number) => {
  if (idx === 0) return <FiAward className="text-yellow-500" />;
  if (idx === 1) return <FiAward className="text-gray-400" />;
  if (idx === 2) return <FiAward className="text-amber-700" />;
  return <FiStar className="text-gray-400" />;
};

const roleStyles: Record<string, string> = {
  Instructor:
    "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20",
  Tutor:
    "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20",
  Student:
    "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10",
};

const Leaderboard = () => {
  const [items, setItems] = useState<LeaderDTO[]>([]);
  const [range, setRange] = useState<string>("This Week");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await http<LeaderboardResponse>("/api/questions/leaderboard");
        if (!alive) return;
        setItems(res.items ?? []);
        setRange(res.range ?? "This Week");
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load leaderboard");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Leaderboard
        </h3>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          {range}
        </span>
      </div>

      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
        Top contributors
      </p>

      {/* States */}
      {loading ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
          Loading leaderboard...
        </div>
      ) : err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {err}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
          No leaderboard data yet.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((u, idx) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition hover:shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              {/* Left */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank */}
                <div className="flex items-center justify-center h-8 w-8">
                  {getRankIcon(idx)}
                </div>


                {/* Name + role */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {u.name}
                  </p>

                  <span
                    className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${roleStyles[u.role]}`}
                  >
                    {u.role}
                  </span>
                </div>
              </div>

              {/* Right stats */}
              <div className="flex items-center gap-5 text-right">
                <div>
                  <p className="flex items-center justify-end gap-1 text-sm font-bold text-gray-900 dark:text-white">
                    {u.points}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    points
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

export default Leaderboard;