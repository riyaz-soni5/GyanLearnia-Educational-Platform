import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Question } from "../app/types/question.types";
import { fetchAnswers, fetchQuestion, postAnswer, type AnswerDTO } from "../services/questions";
import { useToast } from "../components/toast";
import { useNavigate } from "react-router-dom";
import { updateQuestion, deleteQuestion } from "../services/questions";
import RichTextEditor from "../components/RichTextEditor";
import { fetchQuestions } from "../services/questions";
import { FiClock, FiTag } from "react-icons/fi";
import { FaRegQuestionCircle } from "react-icons/fa";

import ConfirmDialog from "../components/ConfirmDialog";

import { BiUpvote, BiDownvote } from "react-icons/bi";
import { FiEye } from "react-icons/fi";
import { FaRegCommentDots } from "react-icons/fa";
import { HiCheckCircle } from "react-icons/hi2";

const Badge = ({ text, tone }: { text: string; tone: "green" | "yellow" | "indigo" | "gray" }) => {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/20"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20"
      : "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>
      {text}
    </span>
  );
};

const VoteBox = ({
  value,
  onUp,
  onDown,
}: {
  value: number;
  onUp: () => void;
  onDown: () => void;
}) => (
  <div className="flex flex-col items-center gap-2">
    <button
      type="button"
      onClick={onUp}
      className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
      title="Upvote (later)"
    >
      <BiUpvote className="h-5 w-5" />
    </button>

    <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>

    <button
      type="button"
      onClick={onDown}
      className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
      title="Downvote (later)"
    >
      <BiDownvote className="h-5 w-5" />
    </button>
  </div>
);

// ✅ date only (no time)
const formatDateOnly = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
};

const QuestionDetailsPage = () => {
  const { showToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const questionId = id || "";

  const nav = useNavigate();

  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ✅ modal states
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<AnswerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [qVotes, setQVotes] = useState(0);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [sort, setSort] = useState<"Top" | "Newest">("Top");

  // ✅ read logged-in user from SAME storage key used in Login.tsx
  type StoredUser = {
    id: string;
    email: string;
    role: "student" | "instructor" | "admin";
    firstName?: string;
    lastName?: string;
  };

  const readStoredUser = (): StoredUser | null => {
    const raw =
      localStorage.getItem("gyanlearnia_user") ||
      sessionStorage.getItem("gyanlearnia_user");

    if (!raw) return null;

    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  };

  // ✅ stable (don’t re-parse every render)
  const me = useMemo(() => readStoredUser(), []);
  const currentUserId = me?.id || "";
  const currentUsername =
    `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim() || me?.email || "";

  // ✅ detect owner safely (supports nested author objects too)
  const isOwner = useMemo(() => {
    if (!question || !currentUserId) return false;

    const ownerId =
      (question as any)?.authorId ??
      (question as any)?.userId ??
      (question as any)?.createdBy ??
      (question as any)?.ownerId ??
      (question as any)?.author?._id ??
      (question as any)?.author?.id ??
      (question as any)?.user?._id ??
      (question as any)?.user?.id;

    if (ownerId) {
      return String(ownerId) === String(currentUserId);
    }

    // fallback only if backend stores author as a string (name/email)
    const authorStr = (question as any)?.author;
    if (authorStr && currentUsername) {
      return String(authorStr).toLowerCase() === String(currentUsername).toLowerCase();
    }

    return false;
  }, [question, currentUserId, currentUsername]);

  // ✅ who answered (for "only one answer per user" rule)
  const getAnswerAuthorId = (a: any): string => {
    return String(
      a?.authorId ??
        a?.userId ??
        a?.createdBy ??
        a?.ownerId ??
        a?.author?._id ??
        a?.author?.id ??
        a?.user?._id ??
        a?.user?.id ??
        ""
    );
  };

  const hasMyAnswer = useMemo(() => {
    if (!currentUserId) return false;
    return answers.some((a: any) => String(getAnswerAuthorId(a)) === String(currentUserId));
  }, [answers, currentUserId]);

  // ✅ can answer only if: logged-in, not question owner, not already answered
  const canAnswer = Boolean(currentUserId) && !isOwner && !hasMyAnswer;

  // ✅ "Answered" should be based on accepted/verified answer, not on just "someone answered"
  const isAnswered = Boolean((question as any)?.hasVerifiedAnswer || (question as any)?.acceptedAnswerId);

  const startEdit = () => {
    if (!question) return;
    setEditTitle((question as any)?.title ?? "");
    setEditExcerpt((question as any)?.excerpt ?? "");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (!question) return;
    setEditTitle((question as any)?.title ?? "");
    setEditExcerpt((question as any)?.excerpt ?? "");
    setIsEditing(false);
  };

  useEffect(() => {
    if (!questionId) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const [qRes, aRes] = await Promise.all([fetchQuestion(questionId), fetchAnswers(questionId)]);

        setQuestion(qRes.item);
        setQVotes(qRes.item.votes ?? 0);
        setAnswers(aRes.items ?? []);

        // ✅ initialize edit fields once data is loaded
        setEditTitle(qRes.item?.title ?? "");
        setEditExcerpt(qRes.item?.excerpt ?? "");
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Failed to load question");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [questionId]);

  useEffect(() => {
    if (!question) return;

    (async () => {
      try {
        const [recentRes, relatedRes] = await Promise.all([
          // latest questions platform-wide
          fetchQuestions({ sort: "Newest", limit: 6 }),

          // questions from same category/subject/level
          fetchQuestions({
            categoryId: question.categoryId,
            level: question.level,
            sort: "Newest",
            limit: 6,
          }),
        ]);

        setRecentQuestions(recentRes.items || []);

        setRelatedQuestions(
          (relatedRes.items || []).filter((q) => q.id !== question.id)
        );
      } catch {
        // sidebar is non-critical → fail silently
      }
    })();
  }, [question]);

  const sortedAnswers = useMemo(() => {
    const list = [...answers];
    const verifiedBoost = (a: AnswerDTO) => (a.isVerified ? 1_000_000 : 0);

    if (sort === "Top") {
      list.sort((a, b) => verifiedBoost(b) + b.votes - (verifiedBoost(a) + a.votes));
      return list;
    }

    list.sort((a, b) => {
      const bt = Date.parse(b.createdAt);
      const at = Date.parse(a.createdAt);
      return (isNaN(bt) ? 0 : bt) - (isNaN(at) ? 0 : at);
    });

    list.sort((a, b) => Number(Boolean(b.isVerified)) - Number(Boolean(a.isVerified)));
    return list;
  }, [answers, sort]);

  const saveEdit = async () => {
    if (!question) return;

    const t = editTitle.trim();
    const ex = editExcerpt.trim();

    if (t.length < 10) return showToast("Title must be at least 10 characters.", "error", { durationMs: 3000 });
    if (ex.length < 20) return showToast("Question details must be at least 20 characters.", "error", { durationMs: 3000 });

    if (saving || deleting) return;

    setSaving(true);

    try {
      const res: any = await updateQuestion(questionId, { title: t, excerpt: ex });
      const updated = res?.item ?? res?.question ?? res?.data ?? res;

      setQuestion((prev) => ({ ...(prev as any), ...(updated as any) }));
      setEditTitle(updated?.title ?? t);
      setEditExcerpt(updated?.excerpt ?? ex);

      setIsEditing(false);
      setConfirmSaveOpen(false);
      showToast("Question updated", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to update question", "error", { durationMs: 3500 });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (deleting || saving) return; // ✅ prevent double actions

    setDeleting(true);

    try {
      await deleteQuestion(questionId);
      setConfirmDeleteOpen(false);
      showToast("Question deleted", "success");
      nav("/questions");
    } catch (e: any) {
      showToast(e?.message || "Failed to delete question", "error", { durationMs: 3500 });
    } finally {
      setDeleting(false);
    }
  };

  const addAnswer = async () => {
    if (!canAnswer) {
      showToast(
        !currentUserId
          ? "Please login to post an answer."
          : isOwner
          ? "You cannot answer your own question. You can reply to answers instead."
          : "You can only post one answer. Delete your answer to post again.",
        "error",
        { durationMs: 3500 }
      );
      return;
    }

    const text = draft.trim();
    if (text.length < 10) return;

    setPosting(true);
    showToast("Posting answer...", "info", { durationMs: 1200 });
    try {
      const res = await postAnswer(questionId, text);
      setAnswers((prev) => [res.answer, ...prev]);
      setDraft("");
      showToast("Answer posted", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to post answer", "error", { durationMs: 3500 });
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300">
        Loading question...
      </div>
    );
  }

  if (err || !question) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-white/10 dark:bg-gray-900">
        <p className="text-lg font-semibold text-gray-900 dark:text-white">Question not found</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {err || "The question you are trying to open doesn’t exist."}
        </p>
        <Link
          to="/questions"
          className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to Questions
        </Link>
      </div>
    );
  }

  const answered = isAnswered;

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* ✅ FULL-WIDTH breadcrumb so ASIDE starts with Question Card (not with breadcrumb height) */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        <Link
          to="/questions"
          className="font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          Questions
        </Link>{" "}
        <span className="text-gray-400">/</span>{" "}
        <span className="text-gray-700 dark:text-gray-200">Details</span>
      </div>

      {/* ✅ Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT (Question + Answers + Write Answer) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ✅ Confirmation Modals */}
          <ConfirmDialog
            open={confirmSaveOpen}
            title="Save changes?"
            description="This will update your question title and details."
            confirmText="Save"
            cancelText="Cancel"
            tone="primary"
            loading={saving}
            onClose={() => {
              if (!saving) setConfirmSaveOpen(false);
            }}
            onConfirm={saveEdit}
          />

          <ConfirmDialog
            open={confirmDeleteOpen}
            title="Delete this question?"
            description="This action is permanent and cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            tone="danger"
            loading={deleting}
            onClose={() => {
              if (!deleting) setConfirmDeleteOpen(false);
            }}
            onConfirm={onDelete}
          />

          {/* Question Card */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
            {/* ✅ Owner actions */}
            {isOwner ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {!isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={startEdit}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOpen(true)}
                      disabled={deleting || saving}
                      className={[
                        "rounded-lg border px-3 py-2 text-sm font-semibold",
                        deleting || saving
                          ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400"
                          : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15",
                      ].join(" ")}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving || deleting}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmSaveOpen(true)}
                      disabled={saving || deleting}
                      className={[
                        "rounded-lg px-3 py-2 text-sm font-semibold text-white transition",
                        saving || deleting ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
                      ].join(" ")}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </>
                )}
              </div>
            ) : null}

            <div className="mt-3 flex items-start gap-5">
              <VoteBox
                value={qVotes}
                onUp={() => setQVotes((v) => v + 1)}
                onDown={() => setQVotes((v) => Math.max(0, v - 1))}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {question.hasVerifiedAnswer ? <Badge text="Verified Answer" tone="indigo" /> : null}
                  {question.isFastResponse ? <Badge text="Fast Response" tone="yellow" /> : null}
                  <Badge text={question.level} tone="gray" />
                  <Badge text={question.subject ?? "General"} tone="gray" />

                  <span
                    className={[
                      "ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                      answered
                        ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20"
                        : "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/20",
                    ].join(" ")}
                  >
                    {answered ? "Answered" : "Unanswered"}
                  </span>
                </div>

                {/* Title */}
                {isEditing ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
                    placeholder="Title"
                  />
                ) : (
                  <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{question.title}</h1>
                )}

                {/* Excerpt */}
                {isEditing ? (
                  <div className="quill-editor mt-3 min-w-0 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
                    <RichTextEditor
                      value={editExcerpt}
                      onChange={setEditExcerpt}
                      placeholder="Update your question..."
                    />
                  </div>
                ) : (
                  <div className="mt-3 min-w-0 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-950">
                    <div
                      className="ql-editor break-words whitespace-pre-wrap"
                      style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                      dangerouslySetInnerHTML={{ __html: question.excerpt ?? "" }}
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {question.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-2">
                    <FiEye className="h-4 w-4" />
                    {question.views} views
                  </span>
                  <span className="inline-flex items-center gap-2">{formatDateOnly(question.createdAt)}</span>
                  <span className="inline-flex items-center gap-2">{question.author}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ✅ Answers */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Answers ({answers.length})</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Verified answers are highlighted.</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sort</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "Top" | "Newest")}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
                >
                  <option value="Top">Top</option>
                  <option value="Newest">Newest</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {sortedAnswers.map((a) => (
                <article
                  key={a.id}
                  className={[
                    "rounded-2xl border p-5",
                    a.isVerified
                      ? "border-indigo-300 bg-indigo-50/40 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                      : "border-gray-200 bg-white dark:border-white/10 dark:bg-gray-950",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-4">
                    <VoteBox value={a.votes} onUp={() => {}} onDown={() => {}} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.isVerified ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
                            <HiCheckCircle className="h-4 w-4" />
                            Verified Answer
                          </span>
                        ) : null}

                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                          {formatDateOnly(a.createdAt)}
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">{a.content}</p>

                      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                        Answered by{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">{a.author}</span>{" "}
                        <span className="text-xs text-gray-500 dark:text-gray-400">({a.authorType ?? "Student"})</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ✅ Add answer (RULES) */}
            {!isOwner ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <FaRegCommentDots className="h-5 w-5" />
                  <h3 className="text-lg font-bold">{hasMyAnswer ? "Your answer" : "Write your answer"}</h3>
                </div>

                {!currentUserId ? (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Please login to post an answer.</p>
                ) : hasMyAnswer ? (
                  (() => {
                    const myAnswer = answers.find((a: any) => String(getAnswerAuthorId(a)) === String(currentUserId));
                    if (!myAnswer) return null;

                    return (
                      <div className="mt-4">
                        {/* show their existing answer */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-950">
                          <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">{myAnswer.content}</p>

                          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            Posted on {formatDateOnly(myAnswer.createdAt)}
                          </div>
                        </div>

                        {/* actions (wire these to your services) */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => showToast("Edit answer: connect updateAnswer API here", "info", { durationMs: 2000 })}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => showToast("Delete answer: connect deleteAnswer API here", "info", { durationMs: 2000 })}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={6}
                      placeholder="Type your answer..."
                      className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
                    />

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Minimum 10 characters.</p>
                      <button
                        type="button"
                        onClick={addAnswer}
                        disabled={posting || draft.trim().length < 10}
                        className={[
                          "rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                          posting || draft.trim().length < 10 ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
                        ].join(" ")}
                      >
                        {posting ? "Posting..." : "Post Answer"}
                      </button>
                    </div>
                  </>
                )}
              </section>
            ) : null}
        </div>

        {/* RIGHT (Aside) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Recent Questions */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Questions</h3>
              <Link
                to="/questions"
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                View all
              </Link>
            </div>

            <div className="p-2">
              {recentQuestions.slice(0, 5).map((q) => (
                <Link
                  key={q.id}
                  to={`/questions/${q.id}`}
                  className="group block rounded-xl px-3 py-3 transition hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-200">
                    {q.title}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <FaRegCommentDots className="h-3.5 w-3.5" />
                      {q.answersCount} answers
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FiEye className="h-3.5 w-3.5" />
                      {q.views} views
                    </span>
                  </div>
                </Link>
              ))}

              {recentQuestions.length === 0 ? (
                <div className="px-3 py-6 text-sm text-gray-500 dark:text-gray-400">No recent questions.</div>
              ) : null}
            </div>
          </section>

          {/* Related Questions */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Related Questions</h3>
            </div>

            <div className="p-2">
              {relatedQuestions.slice(0, 5).map((q) => (
                <Link
                  key={q.id}
                  to={`/questions/${q.id}`}
                  className="group block rounded-xl px-3 py-3 transition hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-200">
                    {q.title}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <FaRegCommentDots className="h-3.5 w-3.5" />
                      {q.answersCount} answers
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FiEye className="h-3.5 w-3.5" />
                      {q.views} views
                    </span>
                  </div>
                </Link>
              ))}

              {relatedQuestions.length === 0 ? (
                <div className="px-3 py-6 text-sm text-gray-500 dark:text-gray-400">
                  No related questions found.
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default QuestionDetailsPage;