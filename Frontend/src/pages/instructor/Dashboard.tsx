import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type InstructorCourse = {
  id: string;
  title: string;
  level: string;
  priceType: "Free" | "Paid";
  priceNpr?: number;
  status: "Draft" | "Published" | "Pending Review";
  enrolled: number;
  rating: number;
  lastUpdated: string;
};

type RecentActivity = {
  id: string;
  type: "Q&A" | "Course" | "Mentor";
  title: string;
  meta: string;
  time: string;
};

const Icon = {
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 5v14M5 12h14"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Upload: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 16V4" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7 9l5-5 5 5"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 20h16" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Star: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2l3 7 7 .6-5.3 4.5 1.7 7L12 17.8 5.6 21.6l1.7-7L2 9.6 9 9l3-7z"
        className="stroke-current"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Users: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM6 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M2 22a6 6 0 0 1 12 0M12 22a6 6 0 0 1 10 0"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Check: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 6L9 17l-5-5"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Clock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M12 6v6l4 2"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Chat: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Badge: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2l3 6 6 .9-4.5 4.3 1.1 6.1L12 20l-5.6 3.3 1.1-6.1L3 8.9 9 8l3-6z"
        className="stroke-current"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const Badge = ({
  text,
  tone,
}: {
  text: string;
  tone: "green" | "yellow" | "indigo" | "gray";
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

const StatCard = ({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
      </div>
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
        {icon}
      </div>
    </div>
  </div>
);

const InstructorDashboardPage = () => {
  // ✅ static instructor profile
  const instructor = {
    name: "Verified Instructor",
    status: "Verified",
    expertise: ["SEE", "+2", "Mathematics"],
  };

  // ✅ static courses list (replace with API later)
  const [courses, setCourses] = useState<InstructorCourse[]>([
    {
      id: "c1",
      title: "Mathematics (Class 10 - SEE)",
      level: "Class 10 (SEE)",
      priceType: "Free",
      status: "Published",
      enrolled: 5320,
      rating: 4.6,
      lastUpdated: "3 days ago",
    },
    {
      id: "c2",
      title: "Physics (+2) — Mechanics",
      level: "+2",
      priceType: "Paid",
      priceNpr: 1499,
      status: "Pending Review",
      enrolled: 2180,
      rating: 4.7,
      lastUpdated: "1 day ago",
    },
    {
      id: "c3",
      title: "Algebra Revision Pack",
      level: "Class 9",
      priceType: "Free",
      status: "Draft",
      enrolled: 0,
      rating: 0,
      lastUpdated: "Today",
    },
  ]);

  const recent: RecentActivity[] = [
    {
      id: "r1",
      type: "Q&A",
      title: "Answered: Quadratic factorization (SEE)",
      meta: "Received 6 upvotes",
      time: "5 hours ago",
    },
    {
      id: "r2",
      type: "Course",
      title: "Updated: Physics (+2) — Mechanics",
      meta: "Added 2 lessons",
      time: "1 day ago",
    },
    {
      id: "r3",
      type: "Mentor",
      title: "New mentee request",
      meta: "Student from Class 10 (SEE)",
      time: "2 days ago",
    },
  ];

  const stats = useMemo(() => {
    const published = courses.filter((c) => c.status === "Published").length;
    const pending = courses.filter((c) => c.status === "Pending Review").length;
    const totalEnroll = courses.reduce((acc, c) => acc + c.enrolled, 0);

    const rated = courses.filter((c) => c.rating > 0);
    const avgRating =
      rated.length === 0
        ? "—"
        : (rated.reduce((acc, c) => acc + c.rating, 0) / rated.length).toFixed(1);

    return { published, pending, totalEnroll, avgRating };
  }, [courses]);

  const statusTone = (s: InstructorCourse["status"]) =>
    s === "Published" ? "green" : s === "Pending Review" ? "yellow" : "gray";

  const priceText = (c: InstructorCourse) =>
    c.priceType === "Free" ? "Free" : `NPR ${c.priceNpr?.toLocaleString()}`;

  const onDeleteDraft = (id: string) => {
    const item = courses.find((c) => c.id === id);
    if (!item || item.status !== "Draft") return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Instructor</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your courses, track enrollments, and support learners (static demo).
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-2 ring-1 ring-gray-200">
                <div className="h-9 w-9 rounded-xl bg-gray-900 text-white grid place-items-center text-sm font-bold">
                  GL
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-gray-900">{instructor.name}</p>
                  <p className="text-xs text-gray-600">
                    Status: <span className="font-semibold">{instructor.status}</span>
                  </p>
                </div>
              </div>

              {instructor.expertise.map((e) => (
                <span
                  key={e}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/instructor/upload-course"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Icon.Upload className="h-4 w-4" />
              Upload Course
            </Link>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => alert("Static UI: add instructor settings later")}
            >
              Settings
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-6 lg:grid-cols-4">
        <StatCard
          label="Published Courses"
          value={`${stats.published}`}
          hint="Visible to learners"
          icon={<Icon.Check className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Review"
          value={`${stats.pending}`}
          hint="Waiting for admin approval"
          icon={<Icon.Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Total Enrollments"
          value={stats.totalEnroll.toLocaleString()}
          hint="Across all your courses"
          icon={<Icon.Users className="h-5 w-5" />}
        />
        <StatCard
          label="Avg Rating"
          value={stats.avgRating}
          hint="Based on rated courses"
          icon={<Icon.Star className="h-5 w-5" />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Courses table/list */}
        <section className="lg:col-span-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your Courses</h2>
              <p className="mt-1 text-sm text-gray-600">
                View status, price, enrollments, and quick actions (static).
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => alert("Static UI: add filter/search later")}
            >
              Filter
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs font-semibold text-gray-500">
                <tr className="border-b border-gray-200">
                  <th className="py-3 pr-4">Course</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Enroll</th>
                  <th className="py-3 pr-4">Rating</th>
                  <th className="py-3 pr-4">Updated</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {courses.map((c) => (
                  <tr key={c.id} className="align-top">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-gray-900">{c.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{c.level}</p>
                    </td>

                    <td className="py-4 pr-4">
                      <Badge text={c.status} tone={statusTone(c.status)} />
                    </td>

                    <td className="py-4 pr-4 font-semibold text-gray-900">{priceText(c)}</td>

                    <td className="py-4 pr-4 text-gray-700">{c.enrolled.toLocaleString()}</td>

                    <td className="py-4 pr-4">
                      {c.rating > 0 ? (
                        <span className="inline-flex items-center gap-2 font-semibold text-gray-900">
                          <Icon.Star className="h-4 w-4 text-gray-700" />
                          {c.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    <td className="py-4 pr-4 text-gray-700">{c.lastUpdated}</td>

                    <td className="py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                          onClick={() => alert(`Static UI: open edit for ${c.id}`)}
                        >
                          Edit
                        </button>

                        {c.status === "Draft" ? (
                          <button
                            type="button"
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                            onClick={() => onDeleteDraft(c.id)}
                            title="Delete draft (static)"
                          >
                            Delete
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                            onClick={() => alert("Static UI: analytics later")}
                          >
                            Analytics
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Note: Connect these actions to backend APIs later (edit, analytics, publish workflow).
          </p>
        </section>

        {/* Right sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Quick tools */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Quick Tools</h3>
            <p className="mt-2 text-sm text-gray-600">Fast shortcuts for instructors.</p>

            <div className="mt-5 space-y-3">
              <Link
                to="/instructor/upload-course"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                <Icon.Plus className="h-4 w-4" />
                Create New Course
              </Link>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => alert("Static UI: open mentor requests later")}
              >
                Mentor Requests
              </button>

              <Link
                to="/questions"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                <Icon.Chat className="h-4 w-4" />
                Go to Q&A
              </Link>
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <p className="mt-2 text-sm text-gray-600">Your latest updates (static).</p>

            <div className="mt-5 space-y-3">
              {recent.map((r) => (
                <div key={r.id} className="rounded-2xl bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">{r.type}</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{r.title}</p>
                      <p className="mt-1 text-xs text-gray-600">{r.meta}</p>
                    </div>
                    <span className="text-xs text-gray-500">{r.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification panel */}
          <div className="rounded-2xl bg-indigo-50 p-6 ring-1 ring-indigo-200">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-700 ring-1 ring-indigo-200">
                <Icon.Badge className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-indigo-900">Verification</p>
                <p className="mt-1 text-sm text-indigo-800">
                  Verified instructors get higher trust in Q&A and mentor discovery.
                </p>

                <button
                  type="button"
                  onClick={() => alert("Static UI: verification flow later")}
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  View Verification Status
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
