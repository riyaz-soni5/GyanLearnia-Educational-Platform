import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { BiDownvote, BiUpvote } from "react-icons/bi";
import { FaRegCommentDots } from "react-icons/fa";
import { HiCheckCircle } from "react-icons/hi2";
import { FiEdit2, FiEye, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { acceptAnswer } from "@/services/questions";

import type { Question } from "@/app/types/question.types";
import type { AnswerDTO } from "@/services/questions";
import {
  deleteQuestion,
  downvoteAnswer,
  downvoteQuestion,
  fetchAnswers,
  fetchQuestion,
  fetchQuestions,
  postAnswer,
  postReply,
  updateAnswer as apiUpdateAnswer,
  updateQuestion,
  deleteAnswer as apiDeleteAnswer,
  upvoteAnswer,
  upvoteQuestion,
} from "@/services/questions";

import ConfirmDialog from "@/components/ConfirmDialog";
import RichTextEditor from "@/components/RichTextEditor";
import { useToast } from "@/components/toast";

// ✅ ADDED (only)
import ReplyThread from "@/components/questions/ReplyThread";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Badge = ({
  text,
  tone,
}: {
  text: string;
  tone: "green" | "yellow" | "indigo" | "gray";
}) => {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/20"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20"
      : "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}
    >
      {text}
    </span>
  );
};

const VoteBox = ({
  value,
  myVote,
  disabled,
  onUp,
  onDown,
  bottomSlot, // ✅ new
}: {
  value: number;
  myVote?: 1 | -1 | null;
  disabled?: boolean;
  onUp: () => void;
  onDown: () => void;
  bottomSlot?: React.ReactNode; // ✅ new
}) => (
  <div className="flex flex-col items-center gap-2">
    <button
      type="button"
      onClick={onUp}
      disabled={disabled}
      className={[
        "rounded-lg border p-2",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        myVote === 1
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-700 border-gray-200",
      ].join(" ")}
    >
      <BiUpvote className="h-5 w-5" />
    </button>

    <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>

    <button
      type="button"
      onClick={onDown}
      disabled={disabled}
      className={[
        "rounded-lg border p-2",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        myVote === -1
          ? "bg-red-600 text-white border-red-600"
          : "bg-white text-gray-700 border-gray-200",
      ].join(" ")}
    >
      <BiDownvote className="h-5 w-5" />
    </button>

    {/* ✅ tick goes below downvote */}
    {bottomSlot ? <div className="pt-1">{bottomSlot}</div> : null}
  </div>
);


const formatDateOnly = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const stripHtml = (html: string) => {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;

  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;

  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w ago`;

  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;

  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
};

const getInitials = (name?: string) => {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase() || a.toUpperCase() || "?";
};

const resolveAssetUrl = (url?: string | null) => {
  if (!url) return null;
  const clean = String(url).trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${API_BASE}${clean.startsWith("/") ? clean : `/${clean}`}`;
};

const Avatar = ({ name, src }: { name?: string; src?: string | null }) =>
  src ? (
    <img
      src={src}
      alt={name || "User avatar"}
      className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-200 dark:ring-white/10"
    />
  ) : (
    <div className="h-9 w-9 rounded-full bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 dark:bg-white/5 dark:ring-white/10 dark:text-gray-200">
      {getInitials(name)}
    </div>
  );

const RolePill = ({ role }: { role?: string }) => {
  const r = String(role || "student").toLowerCase();
  const cls =
    r === "admin"
      ? "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20"
      : r === "instructor"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20"
      : "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}
    >
      {r}
    </span>
  );
};

const OPBadge = () => (
  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20">
    OP
  </span>
);

type VoteResponse = { votes: number; myVote: 1 | -1 | null };

const isVoteResponse = (x: unknown): x is VoteResponse => {
  if (!x || typeof x !== "object") return false;
  const obj = x as any;
  const votesOk = typeof obj.votes === "number";
  const myVoteOk = obj.myVote === null || obj.myVote === 1 || obj.myVote === -1;
  return votesOk && myVoteOk;
};

const QuestionDetailsPage = () => {
  const { showToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const questionId = id || "";

  const nav = useNavigate();
  const loc = useLocation();

  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerText, setEditAnswerText] = useState("");
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null);
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null);
  // ✅ NEW: inline reply composer per answer
  const [activeReplyBoxFor, setActiveReplyBoxFor] = useState<string | null>(null);
  const [replyDraftMap, setReplyDraftMap] = useState<Record<string, string>>({});

  // ✅ NEW: force ReplyThread remount after posting
  const [replyThreadKey, setReplyThreadKey] = useState<Record<string, number>>({});

  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // ✅ ADDED: per-answer toggle (Reddit-like)
  const [openReplyFor, setOpenReplyFor] = useState<Record<string, boolean>>({});

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

  const me = useMemo(() => readStoredUser(), []);
  const currentUserId = me?.id || "";
  const currentUsername =
    `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim() || me?.email || "";

  const requireLoginForVote = () => {
    if (!currentUserId) {
      nav("/login", { state: { from: loc.pathname } });
      return false;
    }
    return true;
  };

  const isOwner = useMemo(() => {
    if (!question || !currentUserId) return false;

    const q: any = question;
    const ownerId =
      q?.authorId ??
      q?.userId ??
      q?.createdBy ??
      q?.ownerId ??
      q?.author?._id ??
      q?.author?.id ??
      q?.user?._id ??
      q?.user?.id;

    if (ownerId) return String(ownerId) === String(currentUserId);

    const authorStr = q?.author;
    if (authorStr && currentUsername) {
      return (
        String(authorStr).toLowerCase() === String(currentUsername).toLowerCase()
      );
    }

    return false;
  }, [question, currentUserId, currentUsername]);

  const getAnswerAuthorId = (a: any): string =>
    String(
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

  const hasMyAnswer = useMemo(() => {
    if (!currentUserId) return false;
    return answers.some((a: any) => getAnswerAuthorId(a) === String(currentUserId));
  }, [answers, currentUserId]);

  const canAnswer = Boolean(currentUserId) && !isOwner && !hasMyAnswer;

  const isAnswered = Boolean(
    (question as any)?.hasVerifiedAnswer || (question as any)?.acceptedAnswerId
  );

  const questionAuthorId = useMemo(() => {
    const q: any = question;
    const idFrom =
      q?.authorId ??
      q?.userId ??
      q?.createdBy ??
      q?.ownerId ??
      q?.author?._id ??
      q?.author?.id ??
      q?.user?._id ??
      q?.user?.id ??
      "";
    return idFrom ? String(idFrom) : "";
  }, [question]);

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
        const [qRes, aRes] = await Promise.all([
          fetchQuestion(questionId),
          fetchAnswers(questionId),
        ]);

        setQuestion(qRes.item);
        setQVotes(qRes.item.votes ?? 0);
        setAnswers(aRes.items ?? []);

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
        const [recentRes, allRes] = await Promise.all([
          fetchQuestions({ sort: "Newest", limit: 6 }),
          fetchQuestions({ sort: "Newest", limit: 40 }),
        ]);

        setRecentQuestions(recentRes.items || []);

        const baseTags = (question as any).tags || [];

        const related = (allRes.items || [])
          .filter((q) => q.id !== (question as any).id)
          .map((q) => {
            const overlap = (q.tags || []).filter((t) => baseTags.includes(t))
              .length;
            return { ...q, _tagOverlap: overlap };
          })
          .filter((q) => q._tagOverlap > 0)
          .sort((a, b) => b._tagOverlap - a._tagOverlap)
          .slice(0, 5);

        setRelatedQuestions(related);
      } catch {
        // ignore aside failures
      }
    })();
  }, [question]);

  const sortedAnswers = useMemo(() => {
    const list = [...answers];
    const verifiedBoost = (a: AnswerDTO) => (a.isVerified ? 1_000_000 : 0);

    if (sort === "Top") {
      list.sort(
        (a, b) => verifiedBoost(b) + b.votes - (verifiedBoost(a) + a.votes)
      );
      return list;
    }

    list.sort((a, b) => {
      const bt = Date.parse(b.createdAt);
      const at = Date.parse(a.createdAt);
      return (Number.isNaN(bt) ? 0 : bt) - (Number.isNaN(at) ? 0 : at);
    });

    list.sort(
      (a, b) => Number(Boolean(b.isVerified)) - Number(Boolean(a.isVerified))
    );
    return list;
  }, [answers, sort]);

  const saveEdit = async () => {
    if (!question) return;

    const t = editTitle.trim();
    const ex = editExcerpt.trim();

    if (t.length < 10)
      return showToast("Title must be at least 10 characters.", "error", {
        durationMs: 3000,
      });
    if (ex.length < 20)
      return showToast(
        "Question details must be at least 20 characters.",
        "error",
        { durationMs: 3000 }
      );

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
      showToast(e?.message || "Failed to update question", "error", {
        durationMs: 3500,
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (deleting || saving) return;

    setDeleting(true);
    try {
      await deleteQuestion(questionId);
      setConfirmDeleteOpen(false);
      showToast("Question deleted", "success");
      nav("/questions");
    } catch (e: any) {
      showToast(e?.message || "Failed to delete question", "error", {
        durationMs: 3500,
      });
    } finally {
      setDeleting(false);
    }
  };

  const postRootReplyToAnswer = async (answerId: string) => {
    if (!requireLoginForVote()) return;

    const html = replyDraftMap[answerId] || "";
    const plain = stripHtml(html);

    if (plain.length < 3) {
      showToast("Reply is too short.", "error", { durationMs: 2500 });
      return;
    }

    try {
      await postReply(questionId, answerId, html, null);

      // clear composer
      setReplyDraftMap((m) => ({ ...m, [answerId]: "" }));
      setActiveReplyBoxFor(null);

      // force ReplyThread to reload (remount)
      setReplyThreadKey((m) => ({ ...m, [answerId]: (m[answerId] || 0) + 1 }));

      showToast("Reply posted", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to post reply", "error", { durationMs: 3500 });
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

    const html = draft || "";
    const plain = stripHtml(html);

    if (plain.length < 10) {
      showToast("Answer must be at least 10 characters.", "error", {
        durationMs: 3000,
      });
      return;
    }

    setPosting(true);
    try {
      const res = await postAnswer(questionId, html);

      const created: any = (res as any)?.answer ?? res;
      const normalizedAnswer: any = {
        ...created,
        content: created?.content ?? html,
        authorId: created?.authorId ?? currentUserId,
        userId: created?.userId ?? currentUserId,
        author: created?.author ?? currentUsername,
        authorAvatarUrl: created?.authorAvatarUrl ?? null,
        authorType: created?.authorType ?? me?.role ?? "student",
      };

      setAnswers((prev) => [normalizedAnswer, ...prev]);
      setDraft("");
      showToast("Answer posted", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to post answer", "error", {
        durationMs: 3500,
      });
    } finally {
      setPosting(false);
    }
  };

  const startAnswerEdit = (answer: AnswerDTO) => {
    setEditingAnswerId(answer.id);
    setEditAnswerText(answer.content || "");
  };

  const cancelAnswerEdit = () => {
    setEditingAnswerId(null);
    setEditAnswerText("");
  };

  const onAcceptAnswer = async (answerId: string) => {
  if (!requireLoginForVote()) return;
  if (!isOwner) return showToast("Only the question owner can accept an answer.", "error");

  try {
    await acceptAnswer(questionId, answerId);

    // ✅ update UI immediately
    setAnswers((prev) =>
      prev.map((x: any) => ({ ...x, isVerified: x.id === answerId }))
    );

    setQuestion((prev) =>
      prev
        ? ({
            ...(prev as any),
            hasVerifiedAnswer: true,
            acceptedAnswerId: answerId,
          } as any)
        : prev
    );

    showToast("Answer marked as correct ✅", "success");
  } catch (e: any) {
    showToast(e?.message || "Failed to accept answer", "error");
  }
};

  const saveAnswerEdit = async () => {
    if (!editingAnswerId) return;

    const html = editAnswerText || "";
    const plain = stripHtml(html);

    if (plain.length < 10) {
      showToast("Answer must be at least 10 characters.", "error", {
        durationMs: 3000,
      });
      return;
    }

    try {
      setSavingAnswerId(editingAnswerId);
      await apiUpdateAnswer(questionId, editingAnswerId, html);

      setAnswers((prev) =>
        prev.map((a) => (a.id === editingAnswerId ? { ...a, content: html } : a))
      );

      showToast("Answer updated", "success");
      cancelAnswerEdit();
    } catch (e: any) {
      showToast(e?.message || "Failed to update answer", "error", {
        durationMs: 3500,
      });
    } finally {
      setSavingAnswerId(null);
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
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          Question not found
        </p>
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
  const categoryLabel =
    (question as any).categoryName || (question as any).subject || "Category";

  return (
    <div className="mx-auto w-full max-w-7xl">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
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

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
            {isOwner ? (
              <div className="flex flex-wrap items-center justify-end gap-3">
                {!isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditTitle((question as any)?.title ?? "");
                        setEditExcerpt((question as any)?.excerpt ?? "");
                        setIsEditing(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      <FiEdit2 className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOpen(true)}
                      disabled={deleting || saving}
                      className={[
                        "inline-flex items-center justify-center rounded-xl px-3 py-2.5 shadow-sm transition",
                        deleting || saving
                          ? "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-white/5"
                          : "bg-red-50 text-red-600 hover:bg-red-100 hover:shadow dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20",
                      ].join(" ")}
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving || deleting}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      <FiX className="h-4 w-4" />
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmSaveOpen(true)}
                      disabled={saving || deleting}
                      className={[
                        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition",
                        saving || deleting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 hover:shadow",
                      ].join(" ")}
                    >
                      <FiSave className="h-4 w-4" />
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </>
                )}
              </div>
            ) : null}

            <div className="mt-3 flex items-start gap-5">
              <div className="flex flex-col items-center gap-2">
                <VoteBox
                  value={qVotes}
                  myVote={(question as any)?.myVote ?? null}
                  onUp={async () => {
                    if (!requireLoginForVote()) return;
                    try {
                      const r: unknown = await upvoteQuestion(questionId);
                      if (!isVoteResponse(r)) {
                        showToast("Unexpected vote response from server", "error");
                        return;
                      }
                      setQVotes(r.votes);
                      setQuestion((prev) =>
                        prev
                          ? ({ ...(prev as any), myVote: r.myVote } as any)
                          : prev
                      );
                    } catch (e: any) {
                      showToast(e?.message || "Failed to vote", "error");
                    }
                  }}
                  onDown={async () => {
                    if (!requireLoginForVote()) return;
                    try {
                      const r: unknown = await downvoteQuestion(questionId);
                      if (!isVoteResponse(r)) {
                        showToast("Unexpected vote response from server", "error");
                        return;
                      }
                      setQVotes(r.votes);
                      setQuestion((prev) =>
                        prev
                          ? ({ ...(prev as any), myVote: r.myVote } as any)
                          : prev
                      );
                    } catch (e: any) {
                      showToast(e?.message || "Failed to vote", "error");
                    }
                  }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  votes
                </span>
              </div>

              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
                    placeholder="Title"
                  />
                ) : (
                  <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                    {(question as any).title}
                  </h1>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {(question as any).hasVerifiedAnswer ? (
                    <Badge text="Verified Answer" tone="indigo" />
                  ) : null}
                  {(question as any).isFastResponse ? (
                    <Badge text="Fast Response" tone="yellow" />
                  ) : null}
                  <Badge text={(question as any).level} tone="gray" />
                  <Badge text={String(categoryLabel)} tone="gray" />

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

                {isEditing ? (
                  <div className="quill-editor mt-3 min-w-0 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
                    <RichTextEditor
                      value={editExcerpt}
                      onChange={setEditExcerpt}
                      placeholder="Update your question..."
                    />
                  </div>
                ) : (
                  <div className="mt-3 min-w-0 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
                    <div
                      className="ql-editor break-words whitespace-pre-wrap"
                      style={{
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: (question as any).excerpt ?? "",
                      }}
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {((question as any).tags || []).map((t: string) => (
                    <span
                      key={t}
                      className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-2">
                    <FiEye className="h-4 w-4" />
                    {(question as any).views} views
                  </span>

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {timeAgo((question as any).createdAt) ||
                      formatDateOnly((question as any).createdAt)}
                  </span>

                  <div className="inline-flex items-center gap-2">
                    <Avatar
                      name={(question as any).author}
                      src={resolveAssetUrl((question as any).authorAvatarUrl)}
                    />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {(question as any).author}
                    </span>
                    <RolePill role={(question as any).authorType} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Answers ({answers.length})
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Verified answers are highlighted.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Sort
                </label>
                <select
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value as "Top" | "Newest")
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
                >
                  <option value="Top">Top</option>
                  <option value="Newest">Newest</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {sortedAnswers.map((a: any) => {
                const aAuthorId = String(getAnswerAuthorId(a));
                const isOP = Boolean(
                  questionAuthorId &&
                    aAuthorId &&
                    String(questionAuthorId) === String(aAuthorId)
                );

                const isReplyOpen = Boolean(openReplyFor[a.id]);

                return (
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
                      <VoteBox
                        value={a.votes}
                        myVote={a.myVote ?? null}
                        onUp={async () => {
                          if (!requireLoginForVote()) return;
                          try {
                            const r: unknown = await upvoteAnswer(questionId, a.id);
                            if (!isVoteResponse(r)) {
                              showToast("Unexpected vote response from server", "error");
                              return;
                            }
                            setAnswers((prev) =>
                              prev.map((x: any) =>
                                x.id === a.id
                                  ? { ...x, votes: r.votes, myVote: r.myVote }
                                  : x
                              )
                            );
                          } catch (e: any) {
                            showToast(e?.message || "Failed to vote", "error");
                          }
                        }}
                        onDown={async () => {
                          if (!requireLoginForVote()) return;
                          try {
                            const r: unknown = await downvoteAnswer(questionId, a.id);
                            if (!isVoteResponse(r)) {
                              showToast("Unexpected vote response from server", "error");
                              return;
                            }
                            setAnswers((prev) =>
                              prev.map((x: any) =>
                                x.id === a.id
                                  ? { ...x, votes: r.votes, myVote: r.myVote }
                                  : x
                              )
                            );
                          } catch (e: any) {
                            showToast(e?.message || "Failed to vote", "error");
                          }
                        }}
                        bottomSlot={
                          isOwner ? (
                            <button
                              type="button"
                              onClick={() => onAcceptAnswer(a.id)}
                              disabled={a.isVerified}
                              className={[
                                "rounded-lg border p-2",
                                a.isVerified
                                  ? "bg-green-50 text-green-700 border-green-200 cursor-default dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20"
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/5",
                              ].join(" ")}
                              title={a.isVerified ? "Already marked correct" : "Mark as correct"}
                            >
                              <HiCheckCircle className="h-5 w-5" />
                            </button>
                          ) : null
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Avatar name={a.author} src={resolveAssetUrl(a.authorAvatarUrl)} />

                          <span className="font-semibold text-gray-900 dark:text-white">
                            {a.author || "Anonymous"}
                          </span>

                          <RolePill role={a.authorType} />

                          {isOP ? <OPBadge /> : null}

                          {a.isVerified ? (
                            <span className="ml-1 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
                              <HiCheckCircle className="h-4 w-4" />
                              Verified
                            </span>
                          ) : null}

                          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                            {timeAgo(a.createdAt) || formatDateOnly(a.createdAt)}
                          </span>
                        </div>

                        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
                          <div
                            className="ql-editor break-words whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200"
                            style={{
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: a.content ?? "",
                            }}
                          />
                        </div>

                        {/* ✅ ADDED: Reddit-like actions row (Reply / Share / Save) */}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                          <button
                            type="button"
                            onClick={() => {
                              if (!requireLoginForVote()) return;
                              setActiveReplyBoxFor((prev) => (prev === a.id ? null : a.id));
                              // keep draft as-is if user reopens
                            }}
                            className="font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
                          >
                            Reply
                          </button>

                        </div>
                        {/* ✅ Inline reply editor (opens immediately when clicking Reply) */}
                        {activeReplyBoxFor === a.id ? (
                          <div className="mt-3">
                            <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
                              <RichTextEditor
                                value={replyDraftMap[a.id] || ""}
                                onChange={(v) => setReplyDraftMap((m) => ({ ...m, [a.id]: v }))}
                                placeholder="Write a reply..."
                              />
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReplyBoxFor(null);
                                  setReplyDraftMap((m) => ({ ...m, [a.id]: "" }));
                                }}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                onClick={() => postRootReplyToAnswer(a.id)}
                                disabled={stripHtml(replyDraftMap[a.id] || "").length < 3}
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {/* ✅ Always show replies preview (1–3) + "See more replies" (Reddit-like) */}
                        <div className="mt-3" id={`answer-${a.id}`}>
                          <ReplyThread
                            key={`${a.id}-${replyThreadKey[a.id] || 0}`} // ✅ remount after posting
                            questionId={questionId}
                            answerId={a.id}
                            requireLogin={requireLoginForVote}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {!isOwner ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <FaRegCommentDots className="h-5 w-5" />
                <h3 className="text-lg font-bold">
                  {hasMyAnswer ? "Your answer" : "Write your answer"}
                </h3>
              </div>

              {!currentUserId ? (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Please login to post an answer.
                </p>
              ) : hasMyAnswer ? (
                (() => {
                  const myAnswer = (answers as any[]).find(
                    (x) =>
                      String(getAnswerAuthorId(x)) === String(currentUserId)
                  );
                  if (!myAnswer) return null;

                  return (
                    <div className="mt-4">
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-2 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {questionAuthorId &&
                            String(getAnswerAuthorId(myAnswer)) ===
                              String(questionAuthorId) ? (
                              <OPBadge />
                            ) : null}
                          </div>
                        </div>

                        {editingAnswerId === myAnswer.id ? (
                          <>
                            <div className="quill-editor mt-4 min-w-0 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
                              <RichTextEditor
                                value={editAnswerText}
                                onChange={setEditAnswerText}
                                placeholder="Update your answer..."
                              />
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={cancelAnswerEdit}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                              >
                                <FiX className="h-4 w-4" />
                                Cancel
                              </button>

                              <button
                                type="button"
                                onClick={saveAnswerEdit}
                                disabled={
                                  savingAnswerId === myAnswer.id ||
                                  stripHtml(editAnswerText).length < 10
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
                              >
                                <FiSave className="h-4 w-4" />
                                {savingAnswerId === myAnswer.id
                                  ? "Saving..."
                                  : "Save Changes"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
                              <div
                                className="ql-editor break-words whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200"
                                style={{
                                  overflowWrap: "anywhere",
                                  wordBreak: "break-word",
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: myAnswer.content ?? "",
                                }}
                              />
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startAnswerEdit(myAnswer)}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                              >
                                <FiEdit2 className="h-4 w-4" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    setDeletingAnswerId(myAnswer.id);
                                    await apiDeleteAnswer(questionId, myAnswer.id);
                                    setAnswers((prev) =>
                                      prev.filter((x: any) => x.id !== myAnswer.id)
                                    );
                                    showToast("Answer deleted", "success");
                                  } catch (e: any) {
                                    showToast(
                                      e?.message || "Failed to delete answer",
                                      "error"
                                    );
                                  } finally {
                                    setDeletingAnswerId(null);
                                  }
                                }}
                                disabled={deletingAnswerId === myAnswer.id}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                              >
                                <FiTrash2 className="h-4 w-4" />
                                {deletingAnswerId === myAnswer.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  <div className="quill-editor mt-4 min-w-0 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
                    <RichTextEditor
                      value={draft}
                      onChange={setDraft}
                      placeholder="Write your answer..."
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Minimum 10 characters.
                    </p>
                    <button
                      type="button"
                      onClick={addAnswer}
                      disabled={posting || stripHtml(draft).length < 10}
                      className={[
                        "rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                        posting || stripHtml(draft).length < 10
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700",
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

        <aside className="lg:col-span-4 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Recent Questions
              </h3>
              <Link
                to="/questions"
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                View all
              </Link>
            </div>

            <div className="p-2">
              {recentQuestions.slice(0, 5).map((q: any) => (
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
                <div className="px-3 py-6 text-sm text-gray-500 dark:text-gray-400">
                  No recent questions.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Related Questions
              </h3>
            </div>

            <div className="p-2">
              {relatedQuestions.slice(0, 5).map((q: any) => (
                <Link
                  key={q.id}
                  to={`/questions/${q.id}`}
                  className="group block rounded-xl px-3 py-3 transition hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-200">
                    {q.title}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      {q.categoryName}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {q.tags?.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

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
