// src/pages/MentorDiscoveryPage.tsx
import { useMemo, useState } from "react";

type MentorType = "Verified Instructor" | "Top Ranked Student";
type Mentor = {
  id: string;
  name: string;
  type: MentorType;
  subjects: string[];
  levelFocus: string[];
  location: string;
  rating: number; // for instructors
  rankPoints: number; // for student mentors
  isAvailable: boolean;
  responseTime: string;
  bio: string;
};

type FeedPostType = "Query" | "Question" | "Resource";
type FeedPost = {
  id: string;
  mentorId: string;
  type: FeedPostType;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  authorName: string;
  authorRole: "Mentor" | "Student";
};

const Badge = ({
  text,
  tone,
}: {
  text: string;
  tone: "indigo" | "green" | "yellow" | "gray";
}) => {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>
      {text}
    </span>
  );
};

const MentorResultCard = ({
  mentor,
  selected,
  onToggle,
}: {
  mentor: Mentor;
  selected: boolean;
  onToggle: (id: string) => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => onToggle(mentor.id)}
      className={`w-full rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md ${
        selected ? "border-indigo-300 bg-indigo-50/40" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-gray-900">{mentor.name}</p>
            <Badge
              text={mentor.type}
              tone={mentor.type === "Verified Instructor" ? "green" : "indigo"}
            />
            {mentor.isAvailable ? <Badge text="Available" tone="yellow" /> : <Badge text="Offline" tone="gray" />}
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{mentor.bio}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {mentor.subjects.slice(0, 5).map((s) => (
              <span
                key={s}
                className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              >
                {s}
              </span>
            ))}
            {mentor.subjects.length > 5 ? (
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                +{mentor.subjects.length - 5} more
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Focus: {mentor.levelFocus.join(", ")} • {mentor.location}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {mentor.type === "Verified Instructor" ? (
            <>
              <p className="text-sm font-semibold text-gray-900">{mentor.rating.toFixed(1)}★</p>
              <p className="mt-1 text-xs text-gray-500">{mentor.responseTime}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-900">{mentor.rankPoints} pts</p>
              <p className="mt-1 text-xs text-gray-500">{mentor.responseTime}</p>
            </>
          )}
          <p className="mt-3 text-xs font-medium text-indigo-700">
            {selected ? "Selected ✓" : "Select"}
          </p>
        </div>
      </div>
    </button>
  );
};

const FeedPostCard = ({ post }: { post: FeedPost }) => {
  const tone =
    post.type === "Question" ? "indigo" : post.type === "Resource" ? "green" : "gray";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge text={post.type} tone={tone as any} />
            <p className="text-xs text-gray-500">{post.createdAt}</p>
          </div>

          <h4 className="mt-2 text-base font-semibold text-gray-900">{post.title}</h4>
          <p className="mt-2 line-clamp-3 text-sm text-gray-600">{post.content}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="cursor-default rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 whitespace-nowrap text-right">
          <p className="text-xs text-gray-500">by</p>
          <p className="text-sm font-medium text-gray-900">{post.authorName}</p>
          <p className="mt-0.5 text-xs text-gray-600">{post.authorRole}</p>
        </div>
      </div>
    </article>
  );
};

const MentorDiscoveryPage = () => {
  // ✅ static mentors (replace with API later)
  const mentors: Mentor[] = [
    {
      id: "m1",
      name: "Astha Sharma",
      type: "Verified Instructor",
      subjects: ["Physics", "Mathematics"],
      levelFocus: ["+2", "Class 10 (SEE)"],
      location: "Kathmandu",
      rating: 4.8,
      rankPoints: 0,
      isAvailable: true,
      responseTime: "Replies within 2 hours",
      bio: "Exam-focused numericals, concept clarity, and step-by-step solutions for SEE and +2.",
    },
    {
      id: "m2",
      name: "Srawan Shrestha",
      type: "Verified Instructor",
      subjects: ["Computer Science", "Web Development", "MERN"],
      levelFocus: ["Skill", "+2"],
      location: "Pokhara",
      rating: 4.6,
      rankPoints: 0,
      isAvailable: false,
      responseTime: "Replies within 6 hours",
      bio: "MERN project mentoring, clean folder structure, and career guidance for beginners.",
    },
    {
      id: "m3",
      name: "Topper Nisha",
      type: "Top Ranked Student",
      subjects: ["Mathematics", "Optional Maths"],
      levelFocus: ["Class 10 (SEE)"],
      location: "Biratnagar",
      rating: 0,
      rankPoints: 920,
      isAvailable: true,
      responseTime: "Replies within 3 hours",
      bio: "SEE topper. I help with quick tricks, practice sets, and exam patterns.",
    },
    {
      id: "m4",
      name: "Senior Aayush",
      type: "Top Ranked Student",
      subjects: ["Accountancy", "Economics"],
      levelFocus: ["+2"],
      location: "Lalitpur",
      rating: 0,
      rankPoints: 780,
      isAvailable: true,
      responseTime: "Replies within 5 hours",
      bio: "Simplifying +2 accounting concepts with examples and easy rules.",
    },
  ];

  // ✅ static posts from mentors
  const posts: FeedPost[] = [
    {
      id: "p1",
      mentorId: "m1",
      type: "Resource",
      title: "Kirchhoff’s Laws: quick note + 1 solved numerical",
      content:
        "KCL + KVL sign convention + loop equation example. Try the problem and post your steps below.",
      tags: ["+2", "Physics", "Notes"],
      createdAt: "Today",
      authorName: "Astha Sharma",
      authorRole: "Mentor",
    },
    {
      id: "p2",
      mentorId: "m3",
      type: "Question",
      title: "How to factorize quickly in SEE exam?",
      content:
        "I use a small checklist: common factor, difference of squares, middle-term split. If you want, share a question and I'll show steps.",
      tags: ["SEE", "Math", "Exam"],
      createdAt: "Yesterday",
      authorName: "Topper Nisha",
      authorRole: "Mentor",
    },
    {
      id: "p3",
      mentorId: "m4",
      type: "Query",
      title: "Rule to remember Debit/Credit (very simple)",
      content:
        "Debit the receiver, Credit the giver (for personal a/c). I’ll share a 2-line memory trick + example entries.",
      tags: ["+2", "Accountancy", "Basics"],
      createdAt: "2 days ago",
      authorName: "Senior Aayush",
      authorRole: "Mentor",
    },
    {
      id: "p4",
      mentorId: "m2",
      type: "Resource",
      title: "FYP Tip: Avoid messy components and routes",
      content:
        "Keep pages thin, shared UI in components, types centralized, and mock data local until backend is ready.",
      tags: ["MERN", "Frontend", "FYP"],
      createdAt: "3 days ago",
      authorName: "Srawan Shrestha",
      authorRole: "Mentor",
    },
  ];

  // Discovery filters
  const [mentorType, setMentorType] = useState<MentorType | "All">("All");
  const [subject, setSubject] = useState("All");
  const [level, setLevel] = useState("All");
  const [availability, setAvailability] = useState<"All" | "Available">("All");
  const [search, setSearch] = useState("");

  // Multi-select mentors
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);

  const filteredMentors = useMemo(() => {
    const q = search.trim().toLowerCase();

    return mentors.filter((m) => {
      const matchesType = mentorType === "All" || m.type === mentorType;
      const matchesSubject = subject === "All" || m.subjects.includes(subject);
      const matchesLevel = level === "All" || m.levelFocus.includes(level);
      const matchesAvailability = availability === "All" || m.isAvailable;

      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.subjects.some((s) => s.toLowerCase().includes(q));

      return (
        matchesType &&
        matchesSubject &&
        matchesLevel &&
        matchesAvailability &&
        matchesSearch
      );
    });
  }, [mentors, mentorType, subject, level, availability, search]);

  const selectedMentors = useMemo(
    () => mentors.filter((m) => selectedMentorIds.includes(m.id)),
    [mentors, selectedMentorIds]
  );

  const combinedFeed = useMemo(() => {
    if (!selectedMentorIds.length) return [];
    return posts
      .filter((p) => selectedMentorIds.includes(p.mentorId))
      .slice()
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)); // simple static sort
  }, [posts, selectedMentorIds]);

  const toggleMentor = (id: string) => {
    setSelectedMentorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedMentorIds([]);

  return (
    <div className="space-y-8">
      {/* Discovery header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Mentor Discovery
        </h1>

        <button className="text-white bg-black">Find Mentor</button>

        {/* Discovery controls */}
        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <label className="text-xs font-medium text-gray-700">Mentor Type</label>
            <select
              value={mentorType}
              onChange={(e) => setMentorType(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="Verified Instructor">Verified Instructor</option>
              <option value="Top Ranked Student">Top Ranked Student</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs font-medium text-gray-700">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option>All</option>
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Accountancy</option>
              <option>Computer Science</option>
              <option>Web Development</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-medium text-gray-700">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option>All</option>
              <option>Class 10 (SEE)</option>
              <option>+2</option>
              <option>Skill</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-medium text-gray-700">Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="Available">Available now</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-medium text-gray-700">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name / keyword..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            Results:{" "}
            <span className="font-medium text-gray-900">{filteredMentors.length}</span>{" "}
            mentor(s)
          </p>

          {selectedMentorIds.length ? (
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear selected ({selectedMentorIds.length})
            </button>
          ) : null}
        </div>

        {/* Selected chips */}
        {selectedMentors.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedMentors.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMentor(m.id)}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100"
                title="Remove"
              >
                {m.name}
                <span className="text-indigo-600">✕</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
            Tip: Select one or more mentors to view their combined feed below.
          </div>
        )}
      </section>

      {/* Mentor results (only after filtering) */}
      <section className="space-y-4">
        {filteredMentors.map((m) => (
          <MentorResultCard
            key={m.id}
            mentor={m}
            selected={selectedMentorIds.includes(m.id)}
            onToggle={toggleMentor}
          />
        ))}

        {!filteredMentors.length ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
            No mentors match your filters.
          </div>
        ) : null}
      </section>

      {/* Feed section */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Mentor Feed</h2>
              <p className="mt-1 text-sm text-gray-600">
                Posts from selected mentors will appear here. Users can post queries/questions (static UI for now).
              </p>
            </div>

            <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
              Static Preview
            </span>
          </div>

          {/* Post composer (enabled UI, still static action) */}
          <div className="mt-5 grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <label className="text-xs font-medium text-gray-700">Post Type</label>
              <select className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                <option>Query</option>
                <option>Question</option>
                <option>Resource</option>
              </select>
            </div>

            <div className="sm:col-span-9">
              <label className="text-xs font-medium text-gray-700">Title</label>
              <input
                placeholder="Write a short title..."
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="text-xs font-medium text-gray-700">Content</label>
              <textarea
                rows={4}
                placeholder="Describe your query/question..."
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              Later: Connect to backend so mentors & learners can post and comment.
            </p>
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              title="Static button"
            >
              Post
            </button>
          </div>
        </div>

        {/* Feed posts */}
        {!selectedMentorIds.length ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
            Select mentors above to load their feed.
          </div>
        ) : combinedFeed.length ? (
          <div className="space-y-4">
            {combinedFeed.map((p) => (
              <FeedPostCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
            No posts found for selected mentors.
          </div>
        )}
      </section>
    </div>
  );
};

export default MentorDiscoveryPage;
