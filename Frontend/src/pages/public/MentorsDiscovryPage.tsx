import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/toast";
import { getUser } from "@/services/session";
import {
  connectWithMentor,
  findMentorMatch,
  type MentorMatch,
} from "@/services/mentorDiscovery";

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
  const [emptyMessage, setEmptyMessage] = useState(
    "Click Find Mentor to get your best-matched mentor."
  );

  const user = getUser();
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

  const avatarUrl = useMemo(() => resolveAvatarUrl(mentor?.avatarUrl), [mentor?.avatarUrl, resolveAvatarUrl]);

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

    setLoadingMatch(true);
    setError(null);

    try {
      const response = await findMentorMatch(normalizedTags);
      setMentor(response.mentor ?? null);
      setEmptyMessage(response.message || "No mentor matches are available right now.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to find mentor";
      setError(message);
      if (message === "Unauthorized") {
        nav("/login", { replace: true });
        return;
      }
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
      setEmptyMessage("Connection updated. Click Find Mentor for another mentor.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      showToast(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-basec">Mentor Discovery</h1>
            <p className="mt-1 text-sm text-muted">
              The system finds one mentor at a time based on your profile and interests.
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
          <label className="text-xs font-medium text-muted">Interest tags for matching</label>
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
          <p className="mt-1 text-[11px] text-muted">
            Add at least one tag before clicking Find Mentor.
          </p>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {mentor ? (
        <section className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
          <div className="flex items-start gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt={mentor.name} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-semibold text-white">
                {mentor.name?.[0]?.toUpperCase() || "M"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold text-basec">{mentor.name}</h2>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Interests</p>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Bio</p>
            <p className="mt-2 text-sm leading-6 text-basec">{mentor.bio}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleConnect}
              disabled={isBusy}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                isBusy ? "cursor-not-allowed bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {actionLoading ? "Working..." : "Connect"}
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-base bg-surface p-10 text-center text-muted">
          {loadingMatch ? "Finding your best mentor..." : emptyMessage}
        </section>
      )}
    </div>
  );
};

export default MentorDiscoveryPage;
