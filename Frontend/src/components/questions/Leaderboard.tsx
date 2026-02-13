// src/components/questions/Leaderboard.tsx
import { useEffect, useState } from "react";
import { http } from "../../services/http";

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
        // ✅ change endpoint if needed
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
    <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Leaderboard</h3>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          {range}
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
        Top contributors based on answers & points.
      </p>

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
        <div className="mt-4 space-y-3">
          {items.map((u, idx) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  <span className="mr-2 text-gray-500 dark:text-gray-400">#{idx + 1}</span>
                  {u.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">{u.role}</p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{u.points}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{u.answers} answers</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4 dark:border-white/10 dark:bg-gray-950">
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Tip: Verified tutors earn more points for verified answers.
        </p>
      </div>
    </aside>
  );
};

export default Leaderboard;