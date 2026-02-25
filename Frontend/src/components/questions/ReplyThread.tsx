// src/components/ReplyThread.tsx
import { useEffect, useState } from "react";
import RichTextEditor from "../RichTextEditor";
import { useToast } from "../toast";
import {
  fetchReplies,
  postReply,
  upvoteReply,
  downvoteReply,
  type ReplyDTO,
} from "@/services/questions";
import { BiUpvote, BiDownvote } from "react-icons/bi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const stripHtml = (html: string) =>
  String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

const resolveAssetUrl = (url?: string | null) => {
  if (!url) return null;
  const clean = String(url).trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${API_BASE}${clean.startsWith("/") ? clean : `/${clean}`}`;
};

const getInitials = (name?: string) => {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase() || a.toUpperCase() || "?";
};

const VoteInline = ({
  votes,
  myVote,
  onUp,
  onDown,
  disabled,
}: {
  votes: number;
  myVote?: 1 | -1 | null;
  onUp: () => void;
  onDown: () => void;
  disabled?: boolean;
}) => {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onUp}
        disabled={disabled}
        className={[
          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          myVote === 1
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-white text-gray-700 border-gray-200",
        ].join(" ")}
      >
        <BiUpvote className="h-4 w-4" />
      </button>

      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
        {votes}
      </span>

      <button
        type="button"
        onClick={onDown}
        disabled={disabled}
        className={[
          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          myVote === -1
            ? "bg-red-600 text-white border-red-600"
            : "bg-white text-gray-700 border-gray-200",
        ].join(" ")}
      >
        <BiDownvote className="h-4 w-4" />
      </button>
    </div>
  );
};

type VoteResponse = { votes: number; myVote: 1 | -1 | null };

const isVoteResponse = (x: unknown): x is VoteResponse => {
  if (!x || typeof x !== "object") return false;
  const obj = x as any;
  const votesOk = typeof obj.votes === "number";
  const myVoteOk = obj.myVote === null || obj.myVote === 1 || obj.myVote === -1;
  return votesOk && myVoteOk;
};

export default function ReplyThread({
  questionId,
  answerId,
  requireLogin,
}: {
  questionId: string;
  answerId: string;
  requireLogin: () => boolean;
}) {
  const { showToast } = useToast();

  const [rootReplies, setRootReplies] = useState<ReplyDTO[]>([]);
  const [rootCursor, setRootCursor] = useState<string | null>(null);
  const [rootHasMore, setRootHasMore] = useState(false);
  const [loadingRoot, setLoadingRoot] = useState(false);

  // reply box under answer
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [draft, setDraft] = useState("");

  // per-reply “reply to reply”
  const [activeReplyTo, setActiveReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  // child replies store
  const [childrenMap, setChildrenMap] = useState<Record<string, ReplyDTO[]>>({});
  const [childCursorMap, setChildCursorMap] = useState<Record<string, string | null>>({});
  const [childHasMoreMap, setChildHasMoreMap] = useState<Record<string, boolean>>({});
  const [loadingChild, setLoadingChild] = useState<Record<string, boolean>>({});

  const loadRoot = async (reset = false) => {
    setLoadingRoot(true);
    try {
      const r = await fetchReplies(questionId, answerId, {
        parentId: null,
        limit: 3,
        cursor: reset ? null : rootCursor,
      });

      if (reset) {
        setRootReplies(r.items || []);
      } else {
        setRootReplies((prev) => [...prev, ...(r.items || [])]);
      }

      setRootHasMore(Boolean(r.hasMore));
      setRootCursor(r.nextCursor ?? null);
    } catch (e: any) {
      showToast(e?.message || "Failed to load replies", "error");
    } finally {
      setLoadingRoot(false);
    }
  };

  const loadChildren = async (parentReplyId: string, reset = false) => {
    setLoadingChild((m) => ({ ...m, [parentReplyId]: true }));
    try {
      const cursor = reset ? null : (childCursorMap[parentReplyId] ?? null);

      const r = await fetchReplies(questionId, answerId, {
        parentId: parentReplyId,
        limit: 3,
        cursor,
      });

      setChildrenMap((m) => ({
        ...m,
        [parentReplyId]: reset
          ? (r.items || [])
          : [...(m[parentReplyId] || []), ...(r.items || [])],
      }));

      setChildHasMoreMap((m) => ({ ...m, [parentReplyId]: Boolean(r.hasMore) }));
      setChildCursorMap((m) => ({ ...m, [parentReplyId]: r.nextCursor ?? null }));
    } catch (e: any) {
      showToast(e?.message || "Failed to load replies", "error");
    } finally {
      setLoadingChild((m) => ({ ...m, [parentReplyId]: false }));
    }
  };

  useEffect(() => {
    // initial root load
    loadRoot(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, answerId]);

  const postRootReply = async () => {
    if (!requireLogin()) return;

    const plain = stripHtml(draft);
    if (plain.length < 3) return showToast("Reply is too short.", "error");

    try {
      const r = await postReply(questionId, answerId, draft, null);
      setRootReplies((prev) => [r.item, ...prev]);
      setDraft("");
      setShowReplyBox(false);
      showToast("Reply posted", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to post reply", "error");
    }
  };

  const postChildReply = async (parentReplyId: string) => {
    if (!requireLogin()) return;

    const plain = stripHtml(replyDraft);
    if (plain.length < 3) return showToast("Reply is too short.", "error");

    try {
      const r = await postReply(questionId, answerId, replyDraft, parentReplyId);

      // make sure children are visible
      setChildrenMap((m) => ({
        ...m,
        [parentReplyId]: [r.item, ...(m[parentReplyId] || [])],
      }));

      setReplyDraft("");
      setActiveReplyTo(null);
      showToast("Reply posted", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to post reply", "error");
    }
  };

  const voteOnReply = async (
    replyId: string,
    dir: "up" | "down",
    parentReplyId?: string | null
  ) => {
    if (!requireLogin()) return;

    try {
      const raw: unknown =
        dir === "up"
          ? await upvoteReply(questionId, answerId, replyId)
          : await downvoteReply(questionId, answerId, replyId);

      if (!isVoteResponse(raw)) {
        showToast("Unexpected vote response from server", "error");
        return;
      }

      const apply = (list: ReplyDTO[]) =>
        list.map((x) =>
          x.id === replyId ? { ...x, votes: raw.votes, myVote: raw.myVote } : x
        );

      if (!parentReplyId) {
        setRootReplies((prev) => apply(prev));
      } else {
        setChildrenMap((m) => ({
          ...m,
          [parentReplyId]: apply(m[parentReplyId] || []),
        }));
      }
    } catch (e: any) {
      showToast(e?.message || "Failed to vote", "error");
    }
  };

  const renderReply = (r: ReplyDTO, depth: number, parentReplyId: string | null) => {
    const children = childrenMap[r.id] || [];
    const hasMore = childHasMoreMap[r.id];
    const isLoading = loadingChild[r.id];
    const avatarSrc = resolveAssetUrl(r.authorAvatarUrl);

    return (
      <div
        key={r.id}
        className={[
          "mt-3",
          depth > 0 ? "pl-6 border-l border-gray-200 dark:border-white/10" : "",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={r.author || "Reply author"}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-white/10"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-700 dark:bg-white/5 dark:ring-white/10 dark:text-gray-200">
              {getInitials(r.author)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {r.author || "Unknown"}
              </span>
              <span>•</span>
              <span>{timeAgo(r.createdAt)}</span>
            </div>

            <div className="mt-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
              <div
                className="ql-editor break-words whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200"
                style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{ __html: r.content ?? "" }}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <VoteInline
                votes={r.votes ?? 0}
                myVote={r.myVote ?? null}
                onUp={() => voteOnReply(r.id, "up", parentReplyId)}
                onDown={() => voteOnReply(r.id, "down", parentReplyId)}
              />

              <button
                type="button"
                onClick={() => {
                  if (!requireLogin()) return;
                  setActiveReplyTo((prev) => (prev === r.id ? null : r.id));
                  setReplyDraft("");
                  // lazy load children when user tries to reply / expand
                  if (!childrenMap[r.id]) loadChildren(r.id, true);
                }}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                Reply
              </button>

              <button
                type="button"
                onClick={() => {
                  // toggle children view: if not loaded => load
                  if (!childrenMap[r.id]) loadChildren(r.id, true);
                  else setChildrenMap((m) => ({ ...m, [r.id]: m[r.id] })); // no-op to keep simple
                }}
                className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
              >
                {children.length > 0 ? `View replies (${children.length})` : "View replies"}
              </button>
            </div>

            {/* reply-to-reply editor */}
            {activeReplyTo === r.id ? (
              <div className="mt-3">
                <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
                  <RichTextEditor
                    value={replyDraft}
                    onChange={setReplyDraft}
                    placeholder="Write a reply..."
                  />
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReplyTo(null);
                      setReplyDraft("");
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => postChildReply(r.id)}
                    disabled={stripHtml(replyDraft).length < 3}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    Reply
                  </button>
                </div>
              </div>
            ) : null}

            {/* children */}
            {children.length > 0 ? (
              <div className="mt-2">
                {children.map((c) => renderReply(c, depth + 1, r.id))}
                {hasMore ? (
                  <button
                    type="button"
                    onClick={() => loadChildren(r.id, false)}
                    disabled={isLoading}
                    className="mt-3 text-xs font-semibold text-indigo-700 hover:text-indigo-800 disabled:opacity-50 dark:text-indigo-300 dark:hover:text-indigo-200"
                  >
                    {isLoading ? "Loading..." : "See more replies"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          Replies
        </p>

        <button
          type="button"
          onClick={() => {
            if (!requireLogin()) return;
            setShowReplyBox((s) => !s);
          }}
          className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          {showReplyBox ? "Cancel" : "Reply"}
        </button>
      </div>

      {showReplyBox ? (
        <div className="mt-3">
          <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-gray-950">
            <RichTextEditor
              value={draft}
              onChange={setDraft}
              placeholder="Write a reply..."
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={postRootReply}
              disabled={stripHtml(draft).length < 3}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              Post Reply
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        {rootReplies.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No replies yet.
          </p>
        ) : (
          rootReplies.map((r) => renderReply(r, 0, null))
        )}

        {rootHasMore ? (
          <button
            type="button"
            onClick={() => loadRoot(false)}
            disabled={loadingRoot}
            className="mt-4 text-xs font-semibold text-indigo-700 hover:text-indigo-800 disabled:opacity-50 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            {loadingRoot ? "Loading..." : "See more replies"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
