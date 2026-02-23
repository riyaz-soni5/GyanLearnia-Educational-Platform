// src/pages/AskQuestionPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createQuestion } from "@/services/questions";
import { fetchCategories } from "@/services/category";
import type { CategoryDTO } from "@/services/category";
import RichTextEditor from "@/components/RichTextEditor";
import { useToast } from "@/components/toast";


const LEVELS = ["School", "+2/High School", "Bachelor", "Master", "PhD", "Others"] as const;

const AskQuestionPage = () => {
  const nav = useNavigate();

  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");

  // ✅ category from DB
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");

  // ✅ fixed levels
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("School");
  const [fast, setFast] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // load categories once
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetchCategories();
        if (!alive) return;

        const items = res.items ?? [];
        setCategories(items);

        // default to first category
        if (items.length && !categoryId) {
          setCategoryId(items[0].id);
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load categories");
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTag = (value: string) => {
  const v = value.trim();
  if (!v) return;
  if (tags.includes(v)) return;
  if (tags.length >= 8) {
    showToast("Maximum 8 tags allowed", "error");
    return;
  }

  setTags((prev) => [...prev, v]);
};

const removeTag = (tag: string) => {
  setTags((prev) => prev.filter((t) => t !== tag));
};

const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addTag(tagInput);
    setTagInput("");
  }

  // remove last tag when backspace and input empty
  if (e.key === "Backspace" && !tagInput && tags.length) {
    setTags((prev) => prev.slice(0, prev.length - 1));
  }
};


  const submit = async () => {
  setErr(null);

  if (title.trim().length < 10) {
    showToast("Title must be at least 10 characters.", "error");
    return;
  }
  if (excerpt.trim().length < 20) {
    showToast("Question details must be at least 20 characters.", "error");
    return;
  }
  if (!categoryId) {
    showToast("Please select a category.", "error");
    return;
  }
  if (!level) {
    showToast("Please select a level.", "error");
    return;
  }

  setPosting(true);

  try {
    const res: any = await createQuestion({
      title: title.trim(),
      excerpt: excerpt.trim(),
      categoryId,
      level,
      tags,
      isFastResponse: fast,
    });

    const item = res?.item ?? res?.question ?? res?.data ?? res;
    const newId = item?.id ?? item?._id;

    showToast("Question posted successfully", "success");

    if (newId) nav(`/questions/${newId}`);
    else nav("/questions");
  } catch (e: any) {
    const msg = e?.message || "Failed to create question";
    setErr(msg);
    showToast(msg, "error", { durationMs: 3500 });
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
            placeholder="e.g., How to center a div in Tailwind?"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-500">Minimum 10 characters.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {categories.length ? (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value="">Loading categories...</option>
              )}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Question Details</label>

          <div className="mt-2 rounded-l border border-gray-300 overflow-hidden quill-editor">
            <RichTextEditor
              value={excerpt}
              onChange={setExcerpt}
              placeholder="Explain Your Question Details here"
              className="bg-white"
            />
          </div>

          <p className="mt-1 text-xs text-gray-500">Minimum 20 characters.</p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Tags</label>

          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100">
            
            {/* existing tags */}
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-indigo-500 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}

            {/* input */}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onTagKeyDown}
              className="flex-1 min-w-[120px] border-none bg-transparent text-sm focus:outline-none"
            />
          </div>
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