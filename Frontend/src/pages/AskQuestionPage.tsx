// src/pages/AskQuestionPage.tsx
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createQuestion } from "../services/questions";

const AskQuestionPage = () => {
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [level, setLevel] = useState("Class 10 (SEE)");
  const [tagsText, setTagsText] = useState("SEE, Exam");
  const [fast, setFast] = useState(false);

  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tags = useMemo(() => {
    return tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
  }, [tagsText]);

  const submit = async () => {
    setErr(null);

    if (title.trim().length < 10) return setErr("Title must be at least 10 characters.");
    if (excerpt.trim().length < 20) return setErr("Question details must be at least 20 characters.");
    if (!subject) return setErr("Please select a subject.");
    if (!level) return setErr("Please select a level.");

    setPosting(true);
    try {
      const res = await createQuestion({
        title: title.trim(),
        excerpt: excerpt.trim(),
        subject,
        level,
        tags,
        isFastResponse: fast,
      });

      // ✅ handle different backend shapes
      const newId = res.item.id;
      nav(`/questions/${newId}`);

      if (!newId) {
        // fallback: go back to list
        nav("/questions");
        return;
      }

      nav(`/questions/${newId}`);
    } catch (e: any) {
      setErr(e?.message || "Failed to create question");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-sm text-gray-600">
        <Link to="/questions" className="font-semibold text-indigo-700 hover:text-indigo-800">
          Questions
        </Link>{" "}
        <span className="text-gray-400">/</span>{" "}
        <span className="text-gray-700">Ask</span>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Ask a Question</h1>
        <p className="text-sm text-gray-600">
          Keep it clear and exam-friendly. Add subject, level, and a few tags.
        </p>

        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div>
          <label className="text-xs font-medium text-gray-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., How to solve quadratic equations by factorization?"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-500">Minimum 10 characters.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option>Class 8</option>
              <option>Class 9</option>
              <option>Class 10 (SEE)</option>
              <option>+2</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>English</option>
              <option>Accountancy</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Question Details</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={7}
            placeholder="Explain what you tried, what is confusing, and what format you want (steps, example, etc.)"
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-500">Minimum 20 characters.</p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Tags (comma separated)</label>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="SEE, Exam, Algebra"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-500">Example: SEE, Exam, Algebra (max 8)</p>
        </div>

        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={fast}
            onChange={(e) => setFast(e.target.checked)}
            className="h-4 w-4"
          />
          Request Fast Response
        </label>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Link
            to="/questions"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={submit}
            disabled={posting}
            className={[
              "rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
              posting ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
            ].join(" ")}
          >
            {posting ? "Posting..." : "Post Question"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default AskQuestionPage;