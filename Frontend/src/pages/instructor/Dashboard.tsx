import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBookOpen, FiCheckCircle, FiClock, FiEdit2, FiShield, FiTrendingUp, FiTrash2 } from "react-icons/fi";

import CourseSubmissionStatusCard from "@/components/instructor/CourseSubmissionStatusCard";
import InstructorHoursChart from "@/components/instructor/InstructorHoursChart";
import InstructorStatCard from "@/components/instructor/InstructorStatCard";
import InstructorStatusChart from "@/components/instructor/InstructorStatusChart";
import { deleteCourse, listMyCourses, type MyInstructorCourse } from "@/services/instructorCourse";
import { getUser } from "@/services/session";
import { getMyVerification, type VerificationStatus } from "@/services/instructorVerification";

const statusTone = (status: MyInstructorCourse["status"]) => {
  if (status === "Published") return "bg-green-50 text-green-700 ring-green-200";
  if (status === "Pending") return "bg-yellow-50 text-yellow-700 ring-yellow-200";
  if (status === "Rejected") return "bg-red-50 text-red-700 ring-red-200";
  return "bg-gray-50 text-gray-700 ring-gray-200";
};

const statusLabel = (status: MyInstructorCourse["status"]) => {
  if (status === "Pending") return "Pending Review";
  return status;
};

const verificationTone = (status: VerificationStatus) => {
  if (status === "Verified") return "bg-green-50 text-green-700 ring-green-200";
  if (status === "Pending") return "bg-yellow-50 text-yellow-700 ring-yellow-200";
  if (status === "Rejected") return "bg-red-50 text-red-700 ring-red-200";
  return "bg-gray-50 text-gray-700 ring-gray-200";
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const getInitials = (firstName?: string, lastName?: string, email?: string) => {
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  if (full) {
    return full
      .split(" ")
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase())
      .join("");
  }
  return (email?.slice(0, 2) || "IN").toUpperCase();
};

export default function InstructorDashboardPage() {
  const navigate = useNavigate();
  const user = getUser();

  const [courses, setCourses] = useState<MyInstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    user?.verificationStatus ?? "NotSubmitted"
  );
  const [verificationReason, setVerificationReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [coursesRes, verificationRes] = await Promise.allSettled([listMyCourses(), getMyVerification()]);

        if (!cancelled) {
          if (coursesRes.status === "fulfilled") {
            setCourses(Array.isArray(coursesRes.value.items) ? coursesRes.value.items : []);
          } else {
            setCourses([]);
            setError(coursesRes.reason instanceof Error ? coursesRes.reason.message : "Failed to load dashboard");
          }

          if (verificationRes.status === "fulfilled") {
            setVerificationStatus(verificationRes.value.status);
            setVerificationReason(verificationRes.value.reason);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((x) => x.status === "Published").length;
    const pending = courses.filter((x) => x.status === "Pending").length;
    const rejected = courses.filter((x) => x.status === "Rejected").length;
    const totalHours =
      Math.round((courses.reduce((acc, c) => acc + Number(c.totalVideoSec || 0), 0) / 3600) * 10) / 10;

    return { total, published, pending, rejected, totalHours };
  }, [courses]);

  const latestReviewCourse = useMemo(
    () => courses.find((c) => c.status === "Pending" || c.status === "Rejected" || c.status === "Draft") ?? null,
    [courses]
  );

  const topPerforming = useMemo(() => {
    return [...courses]
      .map((c) => ({
        ...c,
        score: (c.status === "Published" ? 30 : 0) + c.totalLectures * 2 + Math.round((c.totalVideoSec / 3600) * 10),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [courses]);

  const income = useMemo(() => {
    const publishedPaid = courses.filter((c) => c.status === "Published" && Number(c.priceNpr || 0) > 0);
    const pendingPaid = courses.filter((c) => c.status !== "Published" && Number(c.priceNpr || 0) > 0);

    return {
      liveCatalogValue: publishedPaid.reduce((acc, c) => acc + Number(c.priceNpr || 0), 0),
      pendingCatalogValue: pendingPaid.reduce((acc, c) => acc + Number(c.priceNpr || 0), 0),
      paidPublishedCount: publishedPaid.length,
      paidPipelineCount: pendingPaid.length,
    };
  }, [courses]);

  const onDeleteCourse = async (id: string, title: string) => {
    const ok = window.confirm(`Delete this course permanently?\n\n${title}`);
    if (!ok) return;

    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete course";
      setError(msg);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-8 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-200">Instructor</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Dashboard</h1>
            <p className="mt-2 text-sm text-indigo-100">Track course approval, updates, and publishing workflow.</p>

            <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 ring-1 ring-white/20">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-xs font-bold text-slate-900">
                {getInitials(user?.firstName, user?.lastName, user?.email)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Instructor"}
                </p>
                <p className="text-xs text-indigo-100">{user?.email || "No email"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/instructor/upload-course"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-indigo-50"
            >
              <FiBookOpen className="h-4 w-4" />
              Upload Course
            </Link>
            <Link
              to="/instructor/verify"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <FiShield className="h-4 w-4" />
              {verificationStatus}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <InstructorStatCard
          label="Total Courses"
          value={String(stats.total)}
          hint="All statuses"
          icon={<FiBookOpen className="h-5 w-5" />}
        />
        <InstructorStatCard
          label="Published"
          value={String(stats.published)}
          hint="Live on course page"
          icon={<FiCheckCircle className="h-5 w-5" />}
        />
        <InstructorStatCard
          label="Pending"
          value={String(stats.pending)}
          hint="Waiting admin action"
          icon={<FiClock className="h-5 w-5" />}
        />
        <InstructorStatCard
          label="Content Hours"
          value={`${stats.totalHours}`}
          hint="Total uploaded video hours"
          icon={<FiTrendingUp className="h-5 w-5" />}
        />
        <InstructorStatCard
          label="Live Catalog Value"
          value={`NPR ${income.liveCatalogValue.toLocaleString()}`}
          hint={`${income.paidPublishedCount} paid courses published`}
          icon={<FiTrendingUp className="h-5 w-5" />}
        />
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your Courses</h2>
              <p className="mt-1 text-sm text-gray-600">Dynamic list from your instructor courses.</p>
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-gray-600">Loading courses...</p>
          ) : courses.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">No courses yet</p>
              <p className="mt-1 text-sm text-gray-600">Upload your first course to start the approval workflow.</p>
              <Link
                to="/instructor/upload-course"
                className="mt-3 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create Course
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs font-semibold text-gray-500">
                  <tr className="border-b border-gray-200">
                    <th className="py-3 pr-4">Course</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Lessons</th>
                    <th className="py-3 pr-4">Hours</th>
                    <th className="py-3 pr-4">Submitted</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courses.map((c) => {
                    const hours = Math.round(((c.totalVideoSec || 0) / 3600) * 10) / 10;

                    return (
                      <tr key={c.id} className="align-top">
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-gray-900">{c.title}</p>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-1">{c.subtitle || "No subtitle"}</p>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusTone(c.status)}`}>
                            {statusLabel(c.status)}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-gray-700">{c.totalLectures}</td>
                        <td className="py-4 pr-4 text-gray-700">{hours}</td>
                        <td className="py-4 pr-4 text-gray-700">{formatDate(c.createdAt)}</td>
                        <td className="py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/instructor/upload-course?edit=${c.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                            >
                              <FiEdit2 className="h-4 w-4" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => void onDeleteCourse(c.id, c.title)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                              <FiTrash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="space-y-6 lg:col-span-4">
          {latestReviewCourse ? (
            <CourseSubmissionStatusCard
              course={latestReviewCourse}
              onEdit={(courseId) => navigate(`/instructor/upload-course?edit=${courseId}`)}
            />
          ) : null}

          <InstructorStatusChart
            draft={courses.filter((c) => c.status === "Draft").length}
            pending={courses.filter((c) => c.status === "Pending").length}
            published={courses.filter((c) => c.status === "Published").length}
            rejected={courses.filter((c) => c.status === "Rejected").length}
          />

          <InstructorHoursChart items={courses} />

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900">Most Performing Courses</h3>
            <p className="mt-1 text-xs text-gray-500">Based on status, lesson count, and content hours.</p>

            {topPerforming.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No course data yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {topPerforming.map((c, idx) => (
                  <div key={c.id} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                        {idx + 1}. {c.title}
                      </p>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                        {c.score}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {c.totalLectures} lessons • {Math.round((c.totalVideoSec / 3600) * 10) / 10} hrs • {statusLabel(c.status)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900">Income Snapshot</h3>
            <p className="mt-1 text-xs text-gray-500">Pricing-based catalog value view.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-green-50 p-3 ring-1 ring-green-200">
                <p className="text-xs text-green-700">Live (Published)</p>
                <p className="mt-1 text-lg font-bold text-green-800">
                  NPR {income.liveCatalogValue.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
                <p className="text-xs text-amber-700">Pipeline</p>
                <p className="mt-1 text-lg font-bold text-amber-800">
                  NPR {income.pendingCatalogValue.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              Paid published: {income.paidPublishedCount} • Paid in review/draft: {income.paidPipelineCount}
            </p>
          </div>

          {verificationStatus === "Rejected" && verificationReason ? (
            <div className={`rounded-2xl p-4 ring-1 ${verificationTone("Rejected")}`}>
              <p className="text-sm font-semibold">Verification feedback</p>
              <p className="mt-1 text-xs">{verificationReason}</p>
              <Link to="/instructor/verify" className="mt-3 inline-flex text-xs font-semibold underline">
                Fix and resubmit verification
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
