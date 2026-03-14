import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FiAlertCircle, FiBookOpen, FiDollarSign, FiShield, FiUsers } from "react-icons/fi";
import {
  fetchAdminReportInsights,
  type AdminReportsInsightsResponse,
} from "@/services/adminReports";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  listInstructorVerifications,
  type AdminVerificationItem,
} from "@/services/adminVerification";
import { listAdminCourses } from "@/services/adminCourse";
import type { AdminCourseRow } from "@/app/types/course.type";
import { listContactSubmissions, type ContactSubmissionItem } from "@/services/contactSubmission";

type LinePoint = {
  date: string;
  value: number;
};

type PieSegment = {
  label: string;
  value: number;
  color: string;
};

const formatInteger = (n: number) => n.toLocaleString();
const formatNpr = (n: number) => `NPR ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const statusToneClass = (status: string) =>
  status === "Verified" || status === "Approved"
    ? "bg-green-50 text-green-700 ring-green-200"
    : status === "Rejected"
    ? "bg-red-50 text-red-700 ring-red-200"
    : "bg-yellow-50 text-yellow-700 ring-yellow-200";

const shortDate = (isoDay: string) => {
  const d = new Date(`${isoDay}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDay;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const StatCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) => (
  <div className="min-w-[220px] flex-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-white">{value}</p>
      </div>
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
        {icon}
      </div>
    </div>
  </div>
);

function LineChart({
  points,
  stroke,
  fill,
  emptyText,
}: {
  points: LinePoint[];
  stroke: string;
  fill: string;
  emptyText: string;
}) {
  if (!points.length) return <p className="text-sm text-gray-600 dark:text-gray-300">{emptyText}</p>;

  const width = 560;
  const height = 220;
  const padX = 32;
  const padY = 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const maxValue = Math.max(...points.map((p) => p.value), 1);

  const getX = (index: number) =>
    points.length === 1 ? width / 2 : padX + (index / (points.length - 1)) * innerW;
  const getY = (value: number) => padY + (1 - value / maxValue) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.value)}`)
    .join(" ");
  const baselineY = padY + innerH;
  const areaPath = `${linePath} L ${getX(points.length - 1)} ${baselineY} L ${getX(0)} ${baselineY} Z`;
  const labelIndexes = new Set<number>([0, Math.floor((points.length - 1) / 2), points.length - 1]);

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {[0, 1, 2, 3, 4].map((i) => {
          const y = padY + (i / 4) * innerH;
          return <line key={i} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#E5E7EB" strokeWidth="1" />;
        })}
        <path d={areaPath} fill={fill} />
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={`${p.date}-${i}`} cx={getX(i)} cy={getY(p.value)} r="3" fill={stroke} />
        ))}
      </svg>

      <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
        {points.map((p, i) =>
          labelIndexes.has(i) ? <span key={`${p.date}-label`}>{shortDate(p.date)}</span> : <span key={`${p.date}-sp`} />
        )}
      </div>
    </div>
  );
}

function PieChart({ segments, emptyText }: { segments: PieSegment[]; emptyText: string }) {
  const [tooltip, setTooltip] = useState<{
    label: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return <p className="text-sm text-gray-600 dark:text-gray-300">{emptyText}</p>;

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 82;
  let startAngle = -Math.PI / 2;

  const slices = segments.map((seg) => {
    const fraction = seg.value / total;
    const angle = fraction * Math.PI * 2;
    const endAngle = startAngle + angle;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const path = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");
    startAngle = endAngle;
    return { ...seg, path };
  });

  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full" aria-label="Pie chart">
        {slices.map((slice) => (
          <path
            key={slice.label}
            d={slice.path}
            fill={slice.color}
            stroke="#FFFFFF"
            strokeWidth="2"
            className="cursor-pointer"
            onMouseEnter={(e) => {
              const bounds = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
              const rect = e.currentTarget.getBoundingClientRect();
              if (!bounds) return;
              setTooltip({
                label: slice.label,
                value: slice.value,
                x: rect.left - bounds.left + rect.width / 2,
                y: rect.top - bounds.top + rect.height / 2,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>

      {tooltip ? (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-[180px] -translate-x-1/2 -translate-y-full rounded-lg border border-amber-400 bg-white px-3 py-2 shadow-lg dark:bg-gray-950"
          style={{ left: tooltip.x, top: Math.max(18, tooltip.y - 18) }}
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-white">{tooltip.label}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Value: <span className="font-bold text-gray-900 dark:text-white">{formatInteger(tooltip.value)}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

const AdminDashboardPage = () => {
  const [data, setData] = useState<AdminReportsInsightsResponse | null>(null);
  const [instructorItems, setInstructorItems] = useState<AdminVerificationItem[]>([]);
  const [courseItems, setCourseItems] = useState<AdminCourseRow[]>([]);
  const [contactItems, setContactItems] = useState<ContactSubmissionItem[]>([]);
  const [instructorPage, setInstructorPage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);
  const [messagePage, setMessagePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listPageSize = 5;

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [response, instructorRes, courseRes, contactRes] = await Promise.all([
          fetchAdminReportInsights(30),
          listInstructorVerifications({ status: "All" }),
          listAdminCourses("All"),
          listContactSubmissions(),
        ]);
        if (!active) return;
        setData(response);
        setInstructorItems(
          [...(instructorRes.items || [])]
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        );
        setCourseItems(
          [...(courseRes.items || [])]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
        setContactItems(contactRes.items || []);
      } catch (e: unknown) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load dashboard insights");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const adminCount = data
    ? Math.max(0, data.summary.totalUsers - data.summary.totalStudents - data.summary.totalInstructors)
    : 0;

  const userPoints = useMemo(
    () => (data?.trends || []).map((t) => ({ date: t.date, value: t.users })),
    [data]
  );

  const userComposition = data
    ? [
        { label: "Students", value: data.summary.totalStudents, color: "#4F46E5" },
        { label: "Instructors", value: data.summary.totalInstructors, color: "#10B981" },
        { label: "Admins", value: adminCount, color: "#F59E0B" },
      ]
    : [];

  const topCourses = data?.topCourses.slice(0, 4) || [];
  const instructorTotalPages = Math.max(1, Math.ceil(instructorItems.length / listPageSize));
  const courseTotalPages = Math.max(1, Math.ceil(courseItems.length / listPageSize));
  const messageTotalPages = Math.max(1, Math.ceil(contactItems.length / listPageSize));
  const paginatedInstructorItems = useMemo(
    () => instructorItems.slice((instructorPage - 1) * listPageSize, instructorPage * listPageSize),
    [instructorItems, instructorPage]
  );
  const paginatedCourseItems = useMemo(
    () => courseItems.slice((coursePage - 1) * listPageSize, coursePage * listPageSize),
    [courseItems, coursePage]
  );
  const paginatedContactItems = useMemo(
    () => contactItems.slice((messagePage - 1) * listPageSize, messagePage * listPageSize),
    [contactItems, messagePage]
  );

  useEffect(() => {
    setInstructorPage((current) => Math.min(current, instructorTotalPages));
  }, [instructorTotalPages]);

  useEffect(() => {
    setCoursePage((current) => Math.min(current, courseTotalPages));
  }, [courseTotalPages]);

  useEffect(() => {
    setMessagePage((current) => Math.min(current, messageTotalPages));
  }, [messageTotalPages]);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>
      ) : null}

      <section className="flex flex-wrap gap-6">
        <StatCard
          label="Total Users"
          value={data ? formatInteger(data.summary.totalUsers) : "..."}
          icon={<FiUsers className="h-5 w-5" />}
        />
        <StatCard
          label="Total Courses"
          value={data ? formatInteger(data.summary.publishedCourses) : "..."}
          icon={<FiBookOpen className="h-5 w-5" />}
        />
        <StatCard
          label="Total Revenue"
          value={data ? formatNpr(data.summary.totalRevenueNpr) : "..."}
          icon={<FiDollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Instructor"
          value={data ? formatInteger(data.summary.pendingInstructorVerifications) : "..."}
          icon={<FiShield className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Course"
          value={data ? formatInteger(data.summary.pendingCourseApprovals) : "..."}
          icon={<FiAlertCircle className="h-5 w-5" />}
        />
      </section>

      <div className="flex flex-wrap gap-6">
        <section className="min-w-[320px] flex-[1.4] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">Recent Instructor Request</h2>
            </div>
            <Link
              to="/admin/verify-instructors"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
            >
              View More
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:bg-white/5 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Instructor</th>
                  <th className="px-4 py-3">Expertise</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-white/10 dark:bg-gray-900">
                {paginatedInstructorItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{item.fullName}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.email}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{item.expertise?.[0] || "General"}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusToneClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{new Date(item.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && instructorItems.length === 0 ? (
              <div className="px-4 py-5 text-sm text-gray-600 dark:text-gray-300">No instructor verification records available.</div>
            ) : null}
          </div>

          {!loading ? (
            <AdminPagination page={instructorPage} totalPages={instructorTotalPages} onPageChange={setInstructorPage} />
          ) : null}

        </section>

        <section className="min-w-[320px] flex-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">Recent Course Request</h2>
            </div>
            <Link
              to="/admin/course-approvals"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
            >
              View More
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:bg-white/5 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-white/10 dark:bg-gray-900">
                {paginatedCourseItems.map((item) => (
                  <tr key={String(item.id)}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.instructor?.name || "Unknown instructor"}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{item.category || "Course"}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusToneClass(
                          String(item.status || "Pending")
                        )}`}
                      >
                        {String(item.status || "Pending")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{new Date(item.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && courseItems.length === 0 ? (
              <div className="px-4 py-5 text-sm text-gray-600 dark:text-gray-300">No course approval records available.</div>
            ) : null}
          </div>

          {!loading ? (
            <AdminPagination page={coursePage} totalPages={courseTotalPages} onPageChange={setCoursePage} />
          ) : null}

        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-8 dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">New Users Over Time</h2>
          <div className="mt-5">
            {loading && !data ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading user trend...</p>
            ) : (
              <LineChart points={userPoints} stroke="#059669" fill="#ECFDF5" emptyText="No user growth data yet." />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-4 dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">User Composition</h2>
          <div className="mt-6 flex min-h-[260px] items-center justify-center">
            {loading && !data ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading chart...</p>
            ) : (
              <PieChart segments={userComposition} emptyText="No user composition data yet." />
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7 dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">Top Selling Courses</h2>
          <div className="mt-5 space-y-3">
            {topCourses.map((course, index) => (
              <div key={course.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{course.title}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{course.instructorName}</p>
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatInteger(course.purchases)}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">sales</p>
                  <p className="mt-1 text-xs font-semibold text-indigo-700">{formatNpr(course.revenueNpr)}</p>
                </div>
              </div>
            ))}
            {!loading && topCourses.length === 0 ? <p className="text-sm text-gray-600 dark:text-gray-300">No top course data yet.</p> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5 dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">Messages</h2>
          <div className="mt-5 space-y-3">
            {paginatedContactItems.map((item) => (
              <div key={item.id} className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.firstName} {item.lastName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.email}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.phone}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-700 dark:text-gray-300">{item.message}</p>
              </div>
            ))}
            {!loading && contactItems.length === 0 ? <p className="text-sm text-gray-600 dark:text-gray-300">No contact submissions yet.</p> : null}
          </div>
          {!loading ? (
            <AdminPagination page={messagePage} totalPages={messageTotalPages} onPageChange={setMessagePage} />
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
