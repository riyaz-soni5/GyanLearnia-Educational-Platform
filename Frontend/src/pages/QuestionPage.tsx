// src/pages/QuestionsPage.tsx
import { useEffect, useMemo, useState } from "react";
import QuestionsToolbar from "../components/questions/QuestionToolbar";
import QuestionsList from "../components/questions/QuestionList";
import Leaderboard from "../components/questions/Leaderboard";
import type { Question } from "../app/types/question.types";
import { fetchQuestions } from "../services/questions";

const QuestionsPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [level, setLevel] = useState("All");
  const [sort, setSort] = useState("Newest");

  // if you want "Unanswered" as a filter, map it to status
  const status = useMemo(() => (sort === "Unanswered" ? "Unanswered" : "All"), [sort]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetchQuestions({
          q: query,
          subject,
          level,
          sort,
          status,
          page: 1,
          limit: 30,
        });
        if (!alive) return;
        setQuestions(res.items ?? []);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load questions");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [query, subject, level, sort, status]);

  // Your UI components remain the same
  const filtered = useMemo(() => questions, [questions]);

  return (
    <div className="space-y-8">
      <QuestionsToolbar
        query={query}
        setQuery={setQuery}
        subject={subject}
        setSubject={setSubject}
        level={level}
        setLevel={setLevel}
        sort={sort}
        setSort={setSort}
        count={filtered.length}
      />

      {/* Left list + Right leaderboard */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-600">
              Loading questions...
            </div>
          ) : err ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-sm text-red-600">
              {err}
            </div>
          ) : (
            <QuestionsList questions={filtered} />
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6">
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsPage;