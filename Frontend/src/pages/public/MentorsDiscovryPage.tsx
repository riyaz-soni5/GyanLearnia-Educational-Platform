import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/toast";
import RichTextEditor from "@/components/RichTextEditor";
import { getUser } from "@/services/session";
import {
  connectWithMentor,
  findMentorMatch,
  getConnectionMessages,
  listMentorConnections,
  respondToMentorConnection,
  sendConnectionMessage,
  type MentorChatMessage,
  type MentorConnectionSummary,
  type MentorMatch,
} from "@/services/mentorDiscovery";

const stripHtml = (html: string) =>
  String(html ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const getMessagePreview = (html?: string | null) => {
  const raw = String(html ?? "");
  const plain = stripHtml(raw);
  if (plain) return plain;
  if (/<img\b/i.test(raw)) return "Image";
  return "";
};

const MentorDiscoveryPage = () => {
  const nav = useNavigate();
  const { showToast } = useToast();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [mentor, setMentor] = useState<MentorMatch | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [hasSearched, setHasSearched] = useState(false);

  const [incomingPending, setIncomingPending] = useState<MentorConnectionSummary[]>([]);
  const [outgoingPending, setOutgoingPending] = useState<MentorConnectionSummary[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<MentorConnectionSummary[]>([]);
  const [connectionActionId, setConnectionActionId] = useState<string | null>(null);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesByConnectionId, setMessagesByConnectionId] = useState<
    Record<string, MentorChatMessage[]>
  >({});
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const activeConnectionRef = useRef<string | null>(null);

  const user = getUser();
  const currentUserId = String(user?.id ?? "");
  const isLoggedIn = Boolean(user?.id);
  const isBusy = loadingMatch || actionLoading;

  const resolveAvatarUrl = useCallback(
    (url?: string | null) => {
      if (!url) return null;
      const trimmed = String(url).trim();
      if (!trimmed) return null;
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `${API_BASE}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
    },
    [API_BASE]
  );

  const avatarUrl = useMemo(
    () => resolveAvatarUrl(mentor?.avatarUrl),
    [mentor?.avatarUrl, resolveAvatarUrl]
  );

  const activeConnection = useMemo(
    () =>
      acceptedConnections.find((item) => item.connectionId === activeConnectionId) ??
      acceptedConnections[0] ??
      null,
    [acceptedConnections, activeConnectionId]
  );

  const activeMessages = useMemo(
    () =>
      activeConnection ? messagesByConnectionId[activeConnection.connectionId] ?? [] : [],
    [activeConnection, messagesByConnectionId]
  );
  const chatInputPlain = useMemo(() => stripHtml(chatInput), [chatInput]);
  const chatInputHasImage = useMemo(() => /<img\b/i.test(chatInput), [chatInput]);
  const canSendChat = useMemo(
    () =>
      Boolean(activeConnection?.connectionId) &&
      !sendingChat &&
      (chatInputPlain.length > 0 || chatInputHasImage),
    [activeConnection?.connectionId, sendingChat, chatInputPlain, chatInputHasImage]
  );

  const formatDateTime = (value?: string | null) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString();
  };

  const loadMessages = useCallback(
    async (connectionId: string, silent = false) => {
      if (!connectionId) return;
      if (!silent) setMessagesLoading(true);

      try {
        const response = await getConnectionMessages(connectionId);
        setMessagesByConnectionId((prev) => ({
          ...prev,
          [connectionId]: response.messages,
        }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load messages";
        if (message === "Unauthorized") {
          nav("/login", { replace: true });
          return;
        }
        if (!silent) showToast(message, "error");
      } finally {
        if (!silent) setMessagesLoading(false);
      }
    },
    [nav, showToast]
  );

  const loadConnections = useCallback(
    async (silent = false) => {
      if (!isLoggedIn) return;

      try {
        const response = await listMentorConnections();
        setIncomingPending(response.incomingPending);
        setOutgoingPending(response.outgoingPending);
        setAcceptedConnections(response.acceptedConnections);

        const currentActiveId = activeConnectionRef.current;
        const nextActiveId =
          currentActiveId &&
          response.acceptedConnections.some((item) => item.connectionId === currentActiveId)
            ? currentActiveId
            : response.acceptedConnections[0]?.connectionId ?? null;

        setActiveConnectionId(nextActiveId);
        if (nextActiveId) {
          await loadMessages(nextActiveId, true);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load mentor connections";
        if (message === "Unauthorized") {
          nav("/login", { replace: true });
          return;
        }
        if (!silent) showToast(message, "error");
      }
    },
    [isLoggedIn, loadMessages, nav, showToast]
  );

  useEffect(() => {
    activeConnectionRef.current = activeConnectionId;
  }, [activeConnectionId]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void loadConnections();
  }, [isLoggedIn, loadConnections]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = window.setInterval(() => {
      void loadConnections(true);
    }, 12000);
    return () => window.clearInterval(interval);
  }, [isLoggedIn, loadConnections]);

  useEffect(() => {
    if (!isLoggedIn || !activeConnectionId) return;
    const interval = window.setInterval(() => {
      void loadMessages(activeConnectionId, true);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [activeConnectionId, isLoggedIn, loadMessages]);

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const duplicate = searchTags.some((tag) => tag.toLowerCase() === lower);
    if (duplicate) {
      showToast("Tag already added", "error");
      return;
    }
    setSearchTags((prev) => [...prev, trimmed]);
    setTagInput("");
  };

  const removeTag = (value: string) => {
    setSearchTags((prev) => prev.filter((item) => item !== value));
  };

  const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
      return;
    }

    if (e.key === "Backspace" && !tagInput && searchTags.length > 0) {
      setSearchTags((prev) => prev.slice(0, prev.length - 1));
    }
  };

  const loadMentor = async () => {
    if (!isLoggedIn) {
      nav("/login");
      return;
    }

    const normalizedTags = searchTags
      .map((tag) => String(tag ?? "").trim())
      .filter(Boolean);

    if (!normalizedTags.length) {
      const message = "Please enter interest tags before searching.";
      setError(message);
      showToast(message, "error");
      return;
    }

    setHasSearched(true);          // ✅ mark that user clicked Find Mentor
    setLoadingMatch(true);
    setError(null);

    try {
      const response = await findMentorMatch(normalizedTags);
      setMentor(response.mentor ?? null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to find mentor";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleConnect = async () => {
    if (!mentor?.id || isBusy) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await connectWithMentor(mentor.id);
      showToast(response.message, "success");
      setMentor(null);
      await loadConnections(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      showToast(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespond = async (connectionId: string, action: "accept" | "reject") => {
    if (!connectionId) return;
    setConnectionActionId(connectionId);

    try {
      const response = await respondToMentorConnection(connectionId, action);
      showToast(response.message, action === "accept" ? "success" : "error");
      await loadConnections();
      if (response.status === "Accepted") {
        setActiveConnectionId(response.connectionId);
        await loadMessages(response.connectionId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to respond to request";
      showToast(message, "error");
    } finally {
      setConnectionActionId(null);
    }
  };

  const sendMessage = async () => {
    const connectionId = activeConnection?.connectionId;
    const content = chatInput.trim();
    if (!connectionId || !canSendChat || !content) return;

    setSendingChat(true);
    try {
      const response = await sendConnectionMessage(connectionId, content);
      setChatInput("");
      setMessagesByConnectionId((prev) => {
        const current = prev[connectionId] ?? [];
        return {
          ...prev,
          [connectionId]: [...current, response.message],
        };
      });
      await loadConnections(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      showToast(message, "error");
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-basec">Mentor Discovery</h1>
            <p className="mt-1 text-sm text-muted">
              Find a matched mentor, send connection request, communicate.
            </p>
          </div>

          <button
            type="button"
            onClick={loadMentor}
            disabled={isBusy}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
              isBusy ? "cursor-not-allowed bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loadingMatch ? "Finding..." : "Find Mentor"}
          </button>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-muted">Interest Tags</label>
          <div className="mt-2 rounded-lg border border-base px-3 py-2 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus:ring-indigo-900">
            <div className="flex flex-wrap items-center gap-2">
              {searchTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-indigo-500 hover:text-red-600"
                    disabled={isBusy}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKeyDown}
                placeholder={searchTags.length ? "Add another tag" : "Type interest and press Enter"}
                className="min-w-[160px] flex-1 border-none bg-transparent text-sm text-basec focus:outline-none"
                disabled={isBusy}
              />
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {/* Mentor card (only when a mentor exists) */}
      {mentor && (
        <section className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
          <div className="flex items-start gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={mentor.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-semibold text-white">
                {mentor.name?.[0]?.toUpperCase() || "M"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold text-basec">
                  {mentor.name}
                </h2>
                {mentor.mentorType ? (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                    {mentor.mentorType}
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-muted">
                {mentor.institution?.trim() || "Institution not provided"}
              </p>

              {mentor.expertise ? (
                <p className="mt-2 text-sm text-basec">
                  <span className="font-semibold">Expertise:</span> {mentor.expertise}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Interests
            </p>
            {mentor.interests.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {mentor.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">No interests listed.</p>
            )}
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Bio
            </p>
            <p className="mt-2 text-sm leading-6 text-basec">
              {mentor.bio}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleConnect}
              disabled={isBusy}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                isBusy
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {actionLoading ? "Working..." : "Connect"}
            </button>
          </div>
        </section>
      )}

      {/* Loading state (only while searching) */}
      {loadingMatch && (
        <section className="rounded-2xl border border-base bg-surface p-6 text-center text-muted">
          Finding your best mentor...
        </section>
      )}

      {/* No results (only after user searched) */}
      {hasSearched && !loadingMatch && !mentor && (
        <section className="rounded-2xl border border-base bg-surface p-6 text-center text-muted">
          No mentor matches are available right now.
        </section>
      )}

      <section className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-basec">Connection Requests</h2>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-base p-4">
            <p className="text-sm font-semibold text-basec">Incoming</p>
            <div className="mt-3 space-y-3">
              {incomingPending.length ? (
                incomingPending.map((request) => {
                  const busy = connectionActionId === request.connectionId;
                  const peerAvatar = resolveAvatarUrl(request.peer.avatarUrl);
                  return (
                    <div
                      key={request.connectionId}
                      className="rounded-lg border border-base bg-[rgb(var(--bg))] p-3"
                    >
                      <div className="flex items-start gap-3">
                        {peerAvatar ? (
                          <img
                            src={peerAvatar}
                            alt={request.peer.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                            {request.peer.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-basec">{request.peer.name}</p>
                          <p className="text-xs text-muted">{request.peer.institution || "Institution not set"}</p>
                          <p className="mt-1 text-[11px] text-muted">
                            Requested: {formatDateTime(request.requestedAt) || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleRespond(request.connectionId, "accept")}
                          disabled={busy}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
                            busy ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRespond(request.connectionId, "reject")}
                          disabled={busy}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
                            busy ? "bg-gray-400" : "bg-rose-600 hover:bg-rose-700"
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted">No incoming requests.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-base p-4">
            <p className="text-sm font-semibold text-basec">Sent by You</p>
            <div className="mt-3 space-y-3">
              {outgoingPending.length ? (
                outgoingPending.map((request) => (
                  <div
                    key={request.connectionId}
                    className="rounded-lg border border-base bg-[rgb(var(--bg))] p-3"
                  >
                    <p className="text-sm font-semibold text-basec">{request.peer.name}</p>
                    <p className="text-xs text-muted">{request.peer.institution || "Institution not set"}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      Sent: {formatDateTime(request.requestedAt) || "N/A"}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-amber-700">Waiting for acceptance</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No pending sent requests.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {acceptedConnections.length > 0 && (
        <section className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-basec">Mentor Chat</h2>

          <div className="mt-4 grid gap-4 lg:grid-cols-[280px,1fr]">
            {/* Connections list */}
            <div className="space-y-2 rounded-xl border border-base p-3">
              {acceptedConnections.map((connection) => {
                const isActive =
                  connection.connectionId === activeConnection?.connectionId;

                return (
                  <button
                    key={connection.connectionId}
                    type="button"
                    onClick={() => {
                      setActiveConnectionId(connection.connectionId);
                      void loadMessages(connection.connectionId);
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                        : "border-base bg-[rgb(var(--bg))] text-basec"
                    }`}
                  >
                    <p className="truncate text-sm font-semibold">
                      {connection.peer.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {getMessagePreview(connection.lastMessage?.content) || "No messages yet"}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Chat panel */}
            <div className="rounded-xl border border-base p-3">
              {activeConnection ? (
                <>
                  <div className="border-b border-base pb-3">
                    <p className="text-sm font-semibold text-basec">
                      {activeConnection.peer.name}
                    </p>
                    <p className="text-xs text-muted">
                      Connected:{" "}
                      {formatDateTime(activeConnection.acceptedAt) || "Recently"}
                    </p>
                  </div>

                  <div className="mt-3 h-72 space-y-2 overflow-y-auto rounded-lg border border-base bg-[rgb(var(--bg))] p-3">
                    {messagesLoading ? (
                      <p className="text-sm text-muted">Loading messages...</p>
                    ) : activeMessages.length ? (
                      activeMessages.map((message) => {
                        const mine = message.senderId === currentUserId;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              mine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                mine
                                  ? "bg-indigo-600 text-white"
                                  : "bg-white text-basec ring-1 ring-base"
                              }`}
                            >
                              <div
                                className={`chat-message-html whitespace-pre-wrap break-words ${
                                  mine ? "text-white" : "text-basec"
                                }`}
                                dangerouslySetInnerHTML={{ __html: message.content || "" }}
                              />
                              <p
                                className={`mt-1 text-[10px] ${
                                  mine ? "text-indigo-100" : "text-muted"
                                }`}
                              >
                                {formatDateTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted">
                        No messages yet. Start the conversation.
                      </p>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="chat-quill-editor overflow-hidden rounded-lg border border-base bg-white">
                      <RichTextEditor
                        value={chatInput}
                        onChange={setChatInput}
                        placeholder="Write a rich text message..."
                        className="chat-quill-editor-inner"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => void sendMessage()}
                        disabled={!canSendChat}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                          !canSendChat
                            ? "cursor-not-allowed bg-gray-400"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        {sendingChat ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">
                  Select a connection to open chat.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MentorDiscoveryPage;
