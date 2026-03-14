import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FiUsers, FiBookOpen, FiDollarSign } from "react-icons/fi";
import {
  fetchAdminReportInsights,
  type AdminReportsInsightsResponse,
} from "@/services/adminReports";
import Leaderboard from "@/components/Leaderboard";

type LinePoint = {
  date: string;
  value: number;
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
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-white">{value}</p>
        {hint ? <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">{hint}</p> : null}
      </div>
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
        {icon}
      </div>
    </div>
  </div>
);

function RevenueLineChart({ points }: { points: LinePoint[] }) {
  if (!points.length) {
    return <p className="text-sm text-gray-600 dark:text-gray-300">No revenue trend data yet.</p>;
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

      <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
        {points.map((p, i) =>
          labelIndexes.has(i) ? <span key={`${p.date}-label`}>{shortDate(p.date)}</span> : <span key={`${p.date}-sp`} />
        )}
      </div>
    </div>
  );
}

function UsersLineChart({ points }: { points: LinePoint[] }) {
  if (!points.length) {
    return <p className="text-sm text-gray-600 dark:text-gray-300">No user growth data yet.</p>;
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
  const labelIndexes = new Set<number>([0, Math.floor((points.length - 1) / 2), points.length - 1]);

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-label="New users over time line chart">
        {[0, 1, 2, 3, 4].map((i) => {
          const y = padY + (i / 4) * innerH;
          return <line key={i} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#E5E7EB" strokeWidth="1" />;
        })}

        <path d={areaPath} fill="#ECFDF5" />
        <path d={linePath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />

        {points.map((p, i) => (
          <circle key={`${p.date}-${i}`} cx={getX(i)} cy={getY(p.value)} r="3" fill="#047857" />
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

function UserDonutChart({ segments }: { segments: DonutSegment[] }) {
  const [activeSlice, setActiveSlice] = useState<(DonutSegment & { fraction: number }) | null>(null);
  const [tooltip, setTooltip] = useState<{
    label: string;
    value: number;
    fraction: number;
    x: number;
    y: number;
  } | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return <p className="text-sm text-gray-600 dark:text-gray-300">No user distribution data yet.</p>;

  const cx = 100;
  const cy = 100;
  const radius = 74;

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
    return {
      ...seg,
      fraction,
      path,
    };
  });

    return (
    <div className="space-y-4">
      <div className="relative mx-auto w-52 max-w-full">
        <svg viewBox="0 0 200 200" className="w-full" aria-label="Pie chart">
          {slices.map((slice) => (
            <path
              key={slice.label}
              d={slice.path}
              fill={slice.color}
              stroke="#FFFFFF"
              strokeWidth="2"
              onMouseEnter={(e) => {
                const bounds = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                const rect = e.currentTarget.getBoundingClientRect();
                setActiveSlice(slice);
                if (bounds) {
                  setTooltip({
                    label: slice.label,
                    value: slice.value,
                    fraction: slice.fraction,
                    x: rect.left - bounds.left + rect.width / 2,
                    y: rect.top - bounds.top + rect.height / 2,
                  });
                }
              }}
              onMouseLeave={() => {
                setActiveSlice(null);
                setTooltip(null);
              }}
              onFocus={(e) => {
                const bounds = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                const rect = e.currentTarget.getBoundingClientRect();
                setActiveSlice(slice);
                if (bounds) {
                  setTooltip({
                    label: slice.label,
                    value: slice.value,
                    fraction: slice.fraction,
                    x: rect.left - bounds.left + rect.width / 2,
                    y: rect.top - bounds.top + rect.height / 2,
                  });
                }
              }}
              onBlur={() => {
                setActiveSlice(null);
                setTooltip(null);
              }}
              tabIndex={0}
              className="cursor-pointer outline-none"
            >
              <title>{`${slice.label}: ${formatInteger(slice.value)} (${formatPct(slice.fraction * 100)})`}</title>
            </path>
          ))}
        </svg>

        {tooltip ? (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[180px] -translate-x-1/2 -translate-y-full rounded-lg border border-amber-400 bg-white px-3 py-2 shadow-lg dark:bg-gray-950"
            style={{
              left: tooltip.x,
              top: Math.max(18, tooltip.y - 18),
            }}
          >
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{tooltip.label}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Value: <span className="font-bold text-gray-900 dark:text-white">{formatInteger(tooltip.value)}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatPct(tooltip.fraction * 100)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function QuestionsBarChart({ points }: { points: LinePoint[] }) {
  if (!points.length) {
    return <p className="text-sm text-gray-600 dark:text-gray-300">No questions trend data yet.</p>;
  }

  const width = 560;
  const height = 240;
  const padTop = 20;
  const padBottom = 34;
  const padLeft = 18;
  const padRight = 12;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const maxValue = Math.max(1, ...points.map((p) => p.value));
  const gap = points.length > 14 ? 6 : 10;
  const barWidth = Math.max(8, (innerW - gap * (points.length - 1)) / points.length);

  const getBarHeight = (value: number) => (value <= 0 ? 0 : Math.max(4, (value / maxValue) * innerH));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-gray-900">
        <div className="min-w-[560px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-label="Questions posted bar chart">
            {[0, 1, 2, 3, 4].map((i) => {
              const y = padTop + (i / 4) * innerH;
              return <line key={i} x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#E5E7EB" strokeWidth="1" />;
            })}

            <line
              x1={padLeft}
              y1={height - padBottom}
              x2={width - padRight}
              y2={height - padBottom}
              stroke="#CBD5E1"
              strokeWidth="1.2"
            />

            {points.map((p, index) => {
              const x = padLeft + index * (barWidth + gap);
              const barHeight = getBarHeight(p.value);
              const y = height - padBottom - barHeight;

              return (
                <g key={p.date}>
                  <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" fill="#F59E0B" />
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="fill-gray-800 text-[10px] font-semibold"
                  >
                    {formatInteger(p.value)}
                  </text>
                  {(index % 2 === 0 || points.length <= 8) ? (
                    <text
                      x={x + barWidth / 2}
                      y={height - 12}
                      textAnchor="middle"
                      className="fill-gray-500 text-[10px] font-semibold"
                    >
                      {shortDate(p.date)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

function TimeframeSelect({
  days,
  onChange,
  disabled,
}: {
  days: 7 | 30 | 90;
  onChange: (days: 7 | 30 | 90) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={days}
      onChange={(e) => onChange(Number(e.target.value) as 7 | 30 | 90)}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:focus:ring-indigo-500/20"
      disabled={disabled}
      aria-label="Select report timeframe"
    >
      <option value={7}>Last 7 days</option>
      <option value={30}>Last 30 days</option>
      <option value={90}>Last 90 days</option>
    </select>
  );
}

function TopCourseLeaderboard({
  courses,
}: {
  courses: Array<{ id: string; title: string; instructorName: string; revenueNpr: number; purchases: number }>;
}) {
  if (!courses.length) {
    return <p className="text-sm text-gray-600 dark:text-gray-300">No top-selling course data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {courses.map((course, index) => (
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
    </div>
  );
}

const ReportsPage = () => {
  const [revenueDays, setRevenueDays] = useState<7 | 30 | 90>(30);
  const [usersDays, setUsersDays] = useState<7 | 30 | 90>(30);
  const [questionsDays, setQuestionsDays] = useState<7 | 30 | 90>(30);
  const [coursesDays, setCoursesDays] = useState<7 | 30 | 90>(30);
  const [reportCache, setReportCache] = useState<Partial<Record<7 | 30 | 90, AdminReportsInsightsResponse>>>({});
  const [loadingDays, setLoadingDays] = useState<Partial<Record<7 | 30 | 90, boolean>>>({});
  const [error, setError] = useState<string | null>(null);
  const inFlightDaysRef = useRef<Set<7 | 30 | 90>>(new Set());

  useEffect(() => {
    const requiredDays = Array.from(new Set([30, revenueDays, usersDays, questionsDays, coursesDays])) as Array<7 | 30 | 90>;
    const missingDays = requiredDays.filter((day) => !reportCache[day] && !inFlightDaysRef.current.has(day));

    if (!missingDays.length) return;

    missingDays.forEach((day) => {
      inFlightDaysRef.current.add(day);
      setLoadingDays((current) => ({ ...current, [day]: true }));

      void (async () => {
        try {
          const res = await fetchAdminReportInsights(day);
          setReportCache((current) => ({ ...current, [day]: res }));
          setError(null);
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Failed to load report insights");
        } finally {
          inFlightDaysRef.current.delete(day);
          setLoadingDays((current) => ({ ...current, [day]: false }));
        }
      })();
    });
  }, [coursesDays, questionsDays, reportCache, revenueDays, usersDays]);

  const summaryData = reportCache[30] ?? null;
  const revenueData = reportCache[revenueDays] ?? null;
  const usersData = reportCache[usersDays] ?? null;
  const questionsData = reportCache[questionsDays] ?? null;
  const coursesData = reportCache[coursesDays] ?? null;
  const isRevenueLoading = !revenueData && !!loadingDays[revenueDays];
  const isUsersLoading = !usersData && !!loadingDays[usersDays];
  const isQuestionsLoading = !questionsData && !!loadingDays[questionsDays];
  const isCoursesLoading = !coursesData && !!loadingDays[coursesDays];

  const adminCount = summaryData
    ? Math.max(
        0,
        summaryData.summary.totalUsers - summaryData.summary.totalStudents - summaryData.summary.totalInstructors
      )
    : 0;

  const userRoleSegments = summaryData
    ? [
        { label: "Students", value: summaryData.summary.totalStudents, color: "#4F46E5" },
        { label: "Instructors", value: summaryData.summary.totalInstructors, color: "#10B981" },
        { label: "Admins", value: adminCount, color: "#F59E0B" },
      ]
    : [];

  const questionAnswerSegments = summaryData
    ? [
        { label: "Questions", value: summaryData.summary.totalQuestions, color: "#F59E0B" },
        { label: "Answers", value: summaryData.summary.totalAnswers, color: "#10B981" },
      ]
    : [];

  const revenueLinePoints: LinePoint[] = useMemo(
    () => (revenueData?.trends || []).map((t) => ({ date: t.date, value: t.revenueNpr })),
    [revenueData]
  );

  const userGrowthPoints: LinePoint[] = useMemo(
    () => (usersData?.trends || []).map((t) => ({ date: t.date, value: t.users })),
    [usersData]
  );

  const questionPoints: LinePoint[] = useMemo(() => {
    return (questionsData?.trends || []).map((t) => ({ date: t.date, value: t.questions }));
  }, [questionsData]);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="flex flex-wrap gap-6">
        <div className="min-w-[220px] flex-1">
          <StatCard
            label="Total Users"
            value={summaryData ? formatInteger(summaryData.summary.totalUsers) : "..."}
            hint=""
            icon={<FiUsers className="h-5 w-5" />}
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <StatCard
            label="Total Courses"
            value={summaryData ? formatInteger(summaryData.summary.publishedCourses) : "..."}
            hint=""
            icon={<FiBookOpen className="h-5 w-5" />}
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <StatCard
            label="Total Revenue"
            value={summaryData ? formatNpr(summaryData.summary.totalRevenueNpr) : "..."}
            hint=""
            icon={<FiDollarSign className="h-5 w-5" />}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-6 dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">Platform Revenue Trend</h2>
            </div>
            <TimeframeSelect days={revenueDays} onChange={setRevenueDays} disabled={isRevenueLoading} />
          </div>
          <div className="mt-5">
            {revenueData ? (
              <RevenueLineChart points={revenueLinePoints} />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading chart...</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3 dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">User Composition</h2>
          <div className="mt-5">
            {summaryData ? (
              <UserDonutChart segments={userRoleSegments} />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading chart...</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3 dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">Question vs Answer Ratio</h2>
          <div className="mt-5">
            {summaryData ? (
              <UserDonutChart segments={questionAnswerSegments} />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading chart...</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-8 dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">New Users Over Time</h2>
            </div>
            <TimeframeSelect days={usersDays} onChange={setUsersDays} disabled={isUsersLoading} />
          </div>
          <div className="mt-5">
            {usersData ? <UsersLineChart points={userGrowthPoints} /> : <p className="text-sm text-gray-600 dark:text-gray-300">Loading chart...</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-4 dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">Questions Posted</h2>
            </div>
            <TimeframeSelect days={questionsDays} onChange={setQuestionsDays} disabled={isQuestionsLoading} />
          </div>

          <div className="mt-5">
            {questionsData ? <QuestionsBarChart points={questionPoints} /> : <p className="text-sm text-gray-600 dark:text-gray-300">Loading chart...</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7 dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">Top Selling Courses</h2>
            </div>
            <TimeframeSelect days={coursesDays} onChange={setCoursesDays} disabled={isCoursesLoading} />
          </div>
          <div className="mt-5">
            {coursesData ? (
              <TopCourseLeaderboard
                courses={coursesData.topCourses.map((c) => ({
                  id: c.id,
                  title: c.title,
                  instructorName: c.instructorName,
                  revenueNpr: c.revenueNpr,
                  purchases: c.purchases,
                }))}
              />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading chart...</p>
            )}
          </div>
        </section>

        <div className="lg:col-span-5">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
