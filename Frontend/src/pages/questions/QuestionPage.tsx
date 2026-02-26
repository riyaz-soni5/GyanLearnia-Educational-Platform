// src/pages/QuestionsPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QuestionsToolbar from "@/components/questions/QuestionToolbar";
import QuestionsList from "@/components/questions/QuestionList";
import Leaderboard from "@/components/Leaderboard";
import type { Question } from "@/app/types/question.types";
import { fetchQuestions, upvoteQuestion } from "@/services/questions";
import { fetchCategories } from "@/services/category";
import type { CategoryDTO } from "@/services/category";
import { useToast } from "@/components/toast";
import { getUser } from "@/services/session";

type VoteResponse = { votes: number; myVote: 1 | -1 | null };
type QuestionWithVote = Question & { myVote?: 1 | -1 | null };
type QuestionVoteCache = Record<string, 1 | -1 | null>;
const isVoteResponse = (x: unknown): x is VoteResponse => {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  const votesOk = typeof obj.votes === "number";
  const myVoteOk = obj.myVote === null || obj.myVote === 1 || obj.myVote === -1;
  return votesOk && myVoteOk;
};

const QuestionsPage = () => {
  const nav = useNavigate();
  const loc = useLocation();
  const { showToast } = useToast();
  const voteCacheKey = useMemo(
    () => `gyanlearnia_question_vote_cache_${getUser()?.id ?? "guest"}`,
    []
  );

  const readVoteCache = useCallback((): QuestionVoteCache => {
    try {
      const raw = sessionStorage.getItem(voteCacheKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const safe: QuestionVoteCache = {};
      Object.entries(parsed).forEach(([id, value]) => {
        if (value === 1 || value === -1 || value === null) {
          safe[id] = value;
        }
      });
      return safe;
    } catch {
      return {};
    }
  }, [voteCacheKey]);

  const [voteCache, setVoteCache] = useState<QuestionVoteCache>(() => readVoteCache());

  const [questions, setQuestions] = useState<QuestionWithVote[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [votingQuestionIds, setVotingQuestionIds] = useState<Set<string>>(new Set());

  // ✅ categories from DB
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categoryId, setCategoryId] = useState("All");

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [sort, setSort] = useState("Newest");

  // Status filter is driven by sort selection for Answered/Unanswered modes.
  const status = useMemo(
    () => (sort === "Answered" || sort === "Unanswered" ? sort : "All"),
    [sort]
  );

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
        const latestVoteCache = readVoteCache();
        // Sync active upvote state after remount/back-nav because list API doesn't include myVote.
        setQuestions(
          ((res.items ?? []) as QuestionWithVote[]).map((item) => ({
            ...item,
            myVote:
              item.myVote === 1 || item.myVote === -1 || item.myVote === null
                ? item.myVote
                : latestVoteCache[item.id] ?? null,
          }))
        );
      } catch (e: unknown) {
        if (!alive) return;
        const message = e instanceof Error ? e.message : "Failed to load questions";
        setErr(message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [query, categoryId, level, sort, status, voteCacheKey, readVoteCache]);

  useEffect(() => {
    sessionStorage.setItem(voteCacheKey, JSON.stringify(voteCache));
  }, [voteCache, voteCacheKey]);

  const filtered = useMemo(() => questions, [questions]);

  const setVotingState = (questionId: string, isVoting: boolean) => {
    setVotingQuestionIds((prev) => {
      const next = new Set(prev);
      if (isVoting) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  };

  const requireLoginForVote = () => {
    const me = getUser();
    if (!me?.id) {
      nav("/login", { state: { from: loc.pathname } });
      return false;
    }
    return true;
  };

  // Reuse the same upvote API behavior as Question Details and keep local count/vote state in sync.
  const onUpvoteQuestion = async (questionId: string) => {
    if (!requireLoginForVote()) return;
    if (votingQuestionIds.has(questionId)) return;

    setVotingState(questionId, true);
    try {
      const raw: unknown = await upvoteQuestion(questionId);
      if (!isVoteResponse(raw)) {
        showToast("Unexpected vote response from server", "error");
        return;
      }

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, votes: raw.votes, myVote: raw.myVote }
            : q
        )
      );
      setVoteCache((prev) => {
        const next = { ...prev };
        if (raw.myVote === null) delete next[questionId];
        else next[questionId] = raw.myVote;
        return next;
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to vote";
      showToast(message, "error");
    } finally {
      setVotingState(questionId, false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
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
              <QuestionsList
                questions={filtered}
                onUpvoteQuestion={onUpvoteQuestion}
                votingQuestionIds={votingQuestionIds}
              />
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-6">
              <Leaderboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsPage;
