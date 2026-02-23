// src/pages/QuestionsPage.tsx
import { useEffect, useMemo, useState } from "react";
import QuestionsToolbar from "@/components/questions/QuestionToolbar";
import QuestionsList from "@/components/questions/QuestionList";
import Leaderboard from "@/components/Leaderboard";
import type { Question } from "@/app/types/question.types";
import { fetchQuestions } from "@/services/questions";
import { fetchCategories } from "@/services/category";
import type { CategoryDTO } from "@/services/category";

const QuestionsPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ categories from DB
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categoryId, setCategoryId] = useState("All");

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [sort, setSort] = useState("Newest");

  // if you want "Unanswered" as a filter, map it to status
  const status = useMemo(() => (sort === "Unanswered" ? "Unanswered" : "All"), [sort]);

  // ✅ load categories once
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetchCategories();
        if (!alive) return;
        setCategories(res.items ?? []);
      } catch {
        // keep silent; page still works without categories
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ load questions when filters change
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetchQuestions({
          q: query,
          categoryId, // ✅ backend expects categoryId now
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
  }, [query, categoryId, level, sort, status]);

  const filtered = useMemo(() => questions, [questions]);

  return (
    <div className="space-y-8">
      {/* Toolbar supports dark/light via Tailwind dark: classes */}
      <QuestionsToolbar
        query={query}
        setQuery={setQuery}
        // ✅ keep prop name `subject` for now to avoid refactoring toolbar,
        // but it actually holds categoryId
        subject={categoryId}
        setSubject={setCategoryId}
        level={level}
        setLevel={setLevel}
        sort={sort}
        setSort={setSort}
        count={filtered.length}
        // ✅ optional props (only if your toolbar supports them)
        categories={categories}
      />

      {/* Left list + Right leaderboard */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300">
              Loading questions...
            </div>
          ) : err ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-sm text-red-600 dark:border-red-500/30 dark:bg-gray-900 dark:text-red-300">
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