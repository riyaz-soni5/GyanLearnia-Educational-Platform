import { useEffect, useMemo, useState, type ReactNode, type SVGProps } from "react";
import {
  fetchAdminReportInsights,
  type AdminReportsInsightsResponse,
  type AdminReportTrendPoint,
} from "@/services/adminReports";

const Icon = {
  Users: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M16 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM6 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
        className="stroke-current"
        strokeWidth="1.7"
      />
      <path
        d="M2 22a6 6 0 0 1 12 0M12 22a6 6 0 0 1 10 0"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  Course: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path d="M4 5h16v14H4V5z" className="stroke-current" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 9h8M8 12h8M8 15h6" className="stroke-current" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Revenue: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M12 2v20M17 6.5c0-1.9-2.2-3.5-5-3.5S7 4.6 7 6.5 9.2 10 12 10s5 1.6 5 3.5S14.8 17 12 17s-5-1.6-5-3.5"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  Queue: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

type LinePoint = {
  date: string;
  value: number;
};

type ActivityBarPoint = {
  date: string;
  questions: number;
  answers: number;
  enrollments: number;
  purchases: number;
};

type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

const formatInteger = (n: number) => n.toLocaleString();
const formatNpr = (n: number) => `NPR ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const formatPct = (n: number) => `${n.toFixed(1)}%`;

const shortDate = (isoDay: string) => {
  const d = new Date(`${isoDay}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDay;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const deltaPercent = (current: number, previous: number) => {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const deltaText = (current: number, previous: number) => {
  const pct = deltaPercent(current, previous);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
};

const deltaTone = (current: number, previous: number) => {
  if (current > previous) return "text-green-700";
  if (current < previous) return "text-red-700";
  return "text-gray-700";
};

const StatCard = ({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      </div>
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
        {icon}
      </div>
    </div>
  </div>
);

function RevenueLineChart({ points }: { points: LinePoint[] }) {
  if (!points.length) {
    return <p className="text-sm text-gray-600">No revenue trend data yet.</p>;
  }

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

  const labelIndexes = new Set<number>([
    0,
    Math.floor((points.length - 1) / 2),
    points.length - 1,
  ]);

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-label="Platform revenue line chart">
        {[0, 1, 2, 3, 4].map((i) => {
          const y = padY + (i / 4) * innerH;
          return <line key={i} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#E5E7EB" strokeWidth="1" />;
        })}

        <path d={areaPath} fill="#EEF2FF" />
        <path d={linePath} fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />

        {points.map((p, i) => (
          <circle key={`${p.date}-${i}`} cx={getX(i)} cy={getY(p.value)} r="2.8" fill="#4338CA" />
        ))}
      </svg>

      <div className="flex justify-between text-xs font-semibold text-gray-600">
        {points.map((p, i) =>
          labelIndexes.has(i) ? <span key={`${p.date}-label`}>{shortDate(p.date)}</span> : <span key={`${p.date}-sp`} />
        )}
      </div>
    </div>
  );
}

function UserDonutChart({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return <p className="text-sm text-gray-600">No user distribution data yet.</p>;

  const radius = 58;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;

  let startFraction = 0;
  const rings = segments.map((seg) => {
    const fraction = seg.value / total;
    const dash = fraction * circumference;
    const offset = -startFraction * circumference;
    startFraction += fraction;
    return {
      ...seg,
      dash,
      offset,
    };
  });

  return (
    <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
      <svg viewBox="0 0 160 160" className="mx-auto w-40" aria-label="User role pie chart">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <g transform="rotate(-90 80 80)">
          {rings.map((r) => (
            <circle
              key={r.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={r.color}
              strokeWidth={stroke}
              strokeDasharray={`${r.dash} ${circumference - r.dash}`}
              strokeDashoffset={r.offset}
              strokeLinecap="butt"
            />
          ))}
        </g>
        <text x="80" y="76" textAnchor="middle" className="fill-gray-500 text-[11px] font-semibold">
          Total Users
        </text>
        <text x="80" y="98" textAnchor="middle" className="fill-gray-900 text-lg font-bold">
          {formatInteger(total)}
        </text>
      </svg>

      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-sm font-semibold text-gray-800">{seg.label}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{formatInteger(seg.value)}</p>
              <p className="text-xs text-gray-500">{formatPct((seg.value / total) * 100)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityGroupedBars({ points }: { points: ActivityBarPoint[] }) {
  if (!points.length) {
    return <p className="text-sm text-gray-600">No activity trend data yet.</p>;
  }

  const maxValue = Math.max(
    1,
    ...points.flatMap((p) => [p.questions, p.answers, p.enrollments, p.purchases])
  );

  const items = [
    { key: "questions", label: "Questions", color: "bg-indigo-500" },
    { key: "answers", label: "Answers", color: "bg-emerald-500" },
    { key: "enrollments", label: "Enrollments", color: "bg-amber-500" },
    { key: "purchases", label: "Purchases", color: "bg-rose-500" },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs font-semibold text-gray-600">
        {items.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-[760px] items-end gap-2">
          {points.map((p, index) => (
            <div key={p.date} className="flex-1 min-w-[36px]">
              <div className="mx-auto flex h-36 items-end justify-center gap-1 rounded-xl bg-gray-50 px-1 py-2 ring-1 ring-gray-200">
                {items.map((item) => {
                  const value = p[item.key];
                  const h = value <= 0 ? 0 : Math.max(6, (value / maxValue) * 100);
                  return <span key={item.key} className={`w-1.5 rounded-sm ${item.color}`} style={{ height: `${h}%` }} />;
                })}
              </div>
              <p className="mt-2 text-center text-[10px] font-semibold text-gray-600">
                {index % 2 === 0 || points.length <= 8 ? shortDate(p.date) : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopCourseRevenueBars({
  courses,
}: {
  courses: Array<{ id: string; title: string; revenueNpr: number; purchases: number }>;
}) {
  if (!courses.length) {
    return <p className="text-sm text-gray-600">No course revenue data yet.</p>;
  }

  const maxValue = Math.max(1, ...courses.map((c) => c.revenueNpr));

  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <div key={course.id} className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-gray-900">{course.title}</p>
            <p className="shrink-0 text-sm font-bold text-gray-900">{formatNpr(course.revenueNpr)}</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-indigo-600"
              style={{ width: `${Math.max(4, (course.revenueNpr / maxValue) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-600">{formatInteger(course.purchases)} completed purchases</p>
        </div>
      ))}
    </div>
  );
}

const ReportsPage = () => {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<AdminReportsInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminReportInsights(days);
        if (!alive) return;
        setData(res);
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load report insights");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [days]);

  const pendingQueue = data
    ? data.summary.pendingCourseApprovals + data.summary.pendingInstructorVerifications
    : 0;

  const adminCount = data
    ? Math.max(0, data.summary.totalUsers - data.summary.totalStudents - data.summary.totalInstructors)
    : 0;

  const userRoleSegments = data
    ? [
        { label: "Students", value: data.summary.totalStudents, color: "#4F46E5" },
        { label: "Instructors", value: data.summary.totalInstructors, color: "#10B981" },
        { label: "Admins", value: adminCount, color: "#F59E0B" },
      ]
    : [];

  const revenueLinePoints: LinePoint[] = useMemo(
    () => (data?.trends || []).map((t) => ({ date: t.date, value: t.revenueNpr })),
    [data]
  );

  const activityBars: ActivityBarPoint[] = useMemo(
    () =>
      (data?.trends || []).slice(-14).map((t: AdminReportTrendPoint) => ({
        date: t.date,
        questions: t.questions,
        answers: t.answers,
        enrollments: t.enrollments,
        purchases: t.purchases,
      })),
    [data]
  );

  const splitTotals = useMemo(() => {
    const txs = data?.revenueTransactions || [];
    const gross = txs.reduce((sum, tx) => sum + tx.grossAmountNpr, 0);
    const platform = txs.reduce((sum, tx) => sum + tx.platformFeeNpr, 0);
    const instructor = txs.reduce((sum, tx) => sum + tx.instructorShareNpr, 0);
    const remaining = Math.max(0, gross - platform - instructor);
    return { gross, platform, instructor, remaining };
  }, [data]);

  const windowRows = data
    ? [
        {
          label: "New users",
          current: data.window.users,
          previous: data.window.previous.users,
          value: formatInteger(data.window.users),
          prevText: formatInteger(data.window.previous.users),
        },
        {
          label: "Questions asked",
          current: data.window.questions,
          previous: data.window.previous.questions,
          value: formatInteger(data.window.questions),
          prevText: formatInteger(data.window.previous.questions),
        },
        {
          label: "Answers posted",
          current: data.window.answers,
          previous: data.window.previous.answers,
          value: formatInteger(data.window.answers),
          prevText: formatInteger(data.window.previous.answers),
        },
        {
          label: "Enrollments",
          current: data.window.enrollments,
          previous: data.window.previous.enrollments,
          value: formatInteger(data.window.enrollments),
          prevText: formatInteger(data.window.previous.enrollments),
        },
        {
          label: "Completed purchases",
          current: data.window.purchases,
          previous: data.window.previous.purchases,
          value: formatInteger(data.window.purchases),
          prevText: formatInteger(data.window.previous.purchases),
        },
        {
          label: "Platform Revenue",
          current: data.window.revenueNpr,
          previous: data.window.previous.revenueNpr,
          value: formatNpr(data.window.revenueNpr),
          prevText: formatNpr(data.window.previous.revenueNpr),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Reports & Insights</h1>
            <p className="mt-2 text-sm text-gray-600">Live reports with visual analytics for admins.</p>
            {data ? (
              <p className="mt-1 text-xs text-gray-500">Updated: {new Date(data.generatedAt).toLocaleString()}</p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Window</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value) as 7 | 30 | 90)}
              className="mt-2 w-36 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              disabled={loading}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={data ? formatInteger(data.summary.totalUsers) : "..."}
          hint={
            data
              ? `${formatInteger(data.summary.totalStudents)} students • ${formatInteger(
                  data.summary.totalInstructors
                )} instructors`
              : "Loading"
          }
          icon={<Icon.Users className="h-5 w-5" />}
        />
        <StatCard
          label="Published Courses"
          value={data ? formatInteger(data.summary.publishedCourses) : "..."}
          hint={data ? `${formatInteger(data.summary.totalCourses)} total courses` : "Loading"}
          icon={<Icon.Course className="h-5 w-5" />}
        />
        <StatCard
          label="Platform Revenue"
          value={data ? formatNpr(data.summary.totalRevenueNpr) : "..."}
          hint={
            data
              ? `Platform share from ${formatInteger(data.summary.totalPurchases)} completed purchases`
              : "Loading"
          }
          icon={<Icon.Revenue className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Queue"
          value={data ? formatInteger(pendingQueue) : "..."}
          hint={
            data
              ? `${formatInteger(data.summary.pendingCourseApprovals)} course approvals • ${formatInteger(
                  data.summary.pendingInstructorVerifications
                )} instructor verifications`
              : "Loading"
          }
          icon={<Icon.Queue className="h-5 w-5" />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-8">
          <h2 className="text-lg font-bold text-gray-900">Platform Revenue Trend (Line Graph)</h2>
          <p className="mt-1 text-sm text-gray-600">Daily platform fee revenue over the selected window.</p>
          <div className="mt-5">
            {data ? (
              <RevenueLineChart points={revenueLinePoints} />
            ) : (
              <p className="text-sm text-gray-600">Loading chart...</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-4">
          <h2 className="text-lg font-bold text-gray-900">User Composition (Pie/Donut)</h2>
          <p className="mt-1 text-sm text-gray-600">Share of students, instructors, and admins.</p>
          <div className="mt-5">
            {data ? (
              <UserDonutChart segments={userRoleSegments} />
            ) : (
              <p className="text-sm text-gray-600">Loading chart...</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-8">
          <h2 className="text-lg font-bold text-gray-900">Daily Engagement (Grouped Bar Chart)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Questions, answers, enrollments, and purchases for the last 14 days in the selected window.
          </p>
          <div className="mt-5">
            {data ? <ActivityGroupedBars points={activityBars} /> : <p className="text-sm text-gray-600">Loading chart...</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-4">
          <h2 className="text-lg font-bold text-gray-900">Revenue Split (Stacked Bar)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Split from recent transaction batch currently displayed in the table.
          </p>

          <div className="mt-5">
            {data ? (
              <>
                <div className="h-4 overflow-hidden rounded-full bg-gray-200">
                  {splitTotals.gross > 0 ? (
                    <div className="flex h-4 w-full">
                      <div
                        className="bg-indigo-600"
                        style={{ width: `${(splitTotals.platform / splitTotals.gross) * 100}%` }}
                      />
                      <div
                        className="bg-emerald-500"
                        style={{ width: `${(splitTotals.instructor / splitTotals.gross) * 100}%` }}
                      />
                      <div
                        className="bg-gray-400"
                        style={{ width: `${(splitTotals.remaining / splitTotals.gross) * 100}%` }}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Platform Fee</span>
                    <span className="text-sm font-bold text-indigo-700">{formatNpr(splitTotals.platform)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Instructor Share</span>
                    <span className="text-sm font-bold text-emerald-700">{formatNpr(splitTotals.instructor)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Gross Total</span>
                    <span className="text-sm font-bold text-gray-900">{formatNpr(splitTotals.gross)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">Loading chart...</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Period Comparison</h2>
        <p className="mt-1 text-sm text-gray-600">Current selected window vs previous window.</p>

        <div className="mt-5 space-y-3">
          {loading && !data ? (
            <p className="text-sm text-gray-600">Loading report metrics...</p>
          ) : (
            windowRows.map((row) => (
              <div
                key={row.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200"
              >
                <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-gray-900">{row.value}</span>
                  <span className="text-gray-500">prev {row.prevText}</span>
                  <span className={`font-semibold ${deltaTone(row.current, row.previous)}`}>
                    {deltaText(row.current, row.previous)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Platform Revenue Transactions</h2>
        <p className="mt-1 text-sm text-gray-600">
          Recent completed purchases with gross amount, platform fee, and instructor share.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs font-semibold text-gray-500">
              <tr className="border-b border-gray-200">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Course</th>
                <th className="py-3 pr-4">Learner</th>
                <th className="py-3 pr-4">Gross</th>
                <th className="py-3 pr-4">Platform Fee</th>
                <th className="py-3">Instructor Share</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {(data?.revenueTransactions || []).map((tx) => (
                <tr key={tx.id}>
                  <td className="whitespace-nowrap py-3 pr-4 text-gray-700">{formatDateTime(tx.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-gray-900">{tx.course.title}</p>
                    <p className="mt-1 text-xs text-gray-500">PIDX: {tx.pidx}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-gray-900">{tx.learner.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{tx.learner.email || "No email"}</p>
                  </td>
                  <td className="py-3 pr-4 text-gray-700">{formatNpr(tx.grossAmountNpr)}</td>
                  <td className="py-3 pr-4 font-semibold text-indigo-700">{formatNpr(tx.platformFeeNpr)}</td>
                  <td className="py-3 text-gray-700">{formatNpr(tx.instructorShareNpr)}</td>
                </tr>
              ))}

              {data && data.revenueTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-600">
                    No revenue transactions yet.
                  </td>
                </tr>
              ) : null}

              {!data ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-600">
                    Loading transactions...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7">
          <h2 className="text-lg font-bold text-gray-900">Top Courses by Revenue (Bar Chart)</h2>
          <p className="mt-1 text-sm text-gray-600">Relative performance by revenue within the top courses list.</p>
          <div className="mt-5">
            {data ? (
              <TopCourseRevenueBars
                courses={data.topCourses.map((c) => ({
                  id: c.id,
                  title: c.title,
                  revenueNpr: c.revenueNpr,
                  purchases: c.purchases,
                }))}
              />
            ) : (
              <p className="text-sm text-gray-600">Loading chart...</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">
          <h2 className="text-lg font-bold text-gray-900">Top Instructors</h2>
          <p className="mt-1 text-sm text-gray-600">Based on published course revenue and purchases.</p>

          <div className="mt-5 space-y-3">
            {(data?.topInstructors || []).map((ins) => (
              <div key={ins.id} className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200">
                <p className="text-sm font-semibold text-gray-900">{ins.name}</p>
                <p className="mt-1 text-xs text-gray-500">{ins.email || "No email"}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-700">
                  <span>Courses: {formatInteger(ins.publishedCourses)}</span>
                  <span>Enrollments: {formatInteger(ins.enrollments)}</span>
                  <span>Purchases: {formatInteger(ins.purchases)}</span>
                  <span className="font-semibold text-gray-900">Revenue: {formatNpr(ins.revenueNpr)}</span>
                </div>
              </div>
            ))}

            {data && data.topInstructors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600">
                No instructor revenue data yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportsPage;
