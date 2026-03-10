import User from "../models/User.model.js";
import Course from "../models/Course.model.js";
import Question from "../models/Question.model.js";
import Answer from "../models/Answer.model.js";
import Enrollment from "../models/Enrollment.model.js";
import CoursePurchase from "../models/CoursePurchase.model.js";
import CourseReview from "../models/CourseReview.model.js";
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const startOfUtcDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const addUtcDays = (date, days) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
};
const toIsoDay = (date) => date.toISOString().slice(0, 10);
const toNpr = (paisa) => Number((paisa / 100).toFixed(2));
const toPct = (value) => Number(value.toFixed(1));
const safeNumber = (value) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const growthPct = (current, previous) => {
    if (previous <= 0)
        return current > 0 ? 100 : 0;
    return toPct(((current - previous) / previous) * 100);
};
async function dailyCountMap(params) {
    const rows = (await params.model.aggregate([
        {
            $match: {
                ...(params.match || {}),
                [params.dateField]: { $gte: params.start, $lt: params.endExclusive },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: `$${params.dateField}`,
                    },
                },
                count: { $sum: 1 },
            },
        },
    ]));
    const map = new Map();
    for (const row of rows) {
        const key = String(row._id || "");
        if (!key)
            continue;
        map.set(key, safeNumber(row.count));
    }
    return map;
}
async function dailyRevenueMap(params) {
    const rows = await CoursePurchase.aggregate([
        {
            $match: {
                status: "completed",
                createdAt: { $gte: params.start, $lt: params.endExclusive },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                totalPaisa: { $sum: "$platformFeePaisa" },
            },
        },
    ]);
    const map = new Map();
    for (const row of rows) {
        const key = String(row._id || "");
        if (!key)
            continue;
        map.set(key, safeNumber(row.totalPaisa));
    }
    return map;
}
const countInRange = (model, dateField, start, endExclusive, match = {}) => model.countDocuments({
    ...match,
    [dateField]: { $gte: start, $lt: endExclusive },
});
const revenueInRangePaisa = async (start, endExclusive) => {
    const rows = await CoursePurchase.aggregate([
        {
            $match: {
                status: "completed",
                createdAt: { $gte: start, $lt: endExclusive },
            },
        },
        { $group: { _id: null, totalPaisa: { $sum: "$platformFeePaisa" } } },
    ]);
    return safeNumber(rows[0]?.totalPaisa);
};
export async function getAdminReportInsights(req, res) {
    try {
        const parsedDays = parseInt(String(req.query.days || "30"), 10);
        const windowDays = clamp(Number.isNaN(parsedDays) ? 30 : parsedDays, 7, 90);
        const todayStart = startOfUtcDay(new Date());
        const endExclusive = addUtcDays(todayStart, 1); // tomorrow 00:00 UTC
        const windowStart = addUtcDays(todayStart, -(windowDays - 1));
        const previousWindowStart = addUtcDays(windowStart, -windowDays);
        const previousWindowEndExclusive = windowStart;
        const [totalUsers, totalStudents, totalInstructors, verifiedInstructors, pendingInstructorVerifications, totalQuestions, answeredQuestions, verifiedAnswerQuestions, totalAnswers, totalCourses, publishedCourses, pendingCourseApprovals, totalEnrollments, completedEnrollments, totalPurchases, totalRevenueAgg, usersInWindow, usersInPreviousWindow, questionsInWindow, questionsInPreviousWindow, answersInWindow, answersInPreviousWindow, enrollmentsInWindow, enrollmentsInPreviousWindow, purchasesInWindow, purchasesInPreviousWindow, revenueInWindowPaisa, revenueInPreviousWindowPaisa,] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ role: "student" }),
            User.countDocuments({ role: "instructor" }),
            User.countDocuments({ role: "instructor", isVerified: true }),
            User.countDocuments({ role: "instructor", verificationStatus: "Pending" }),
            Question.countDocuments({}),
            Question.countDocuments({ answersCount: { $gt: 0 } }),
            Question.countDocuments({ hasVerifiedAnswer: true }),
            Answer.countDocuments({}),
            Course.countDocuments({}),
            Course.countDocuments({ status: "Published" }),
            Course.countDocuments({ status: "Pending" }),
            Enrollment.countDocuments({}),
            Enrollment.countDocuments({ completedAt: { $ne: null } }),
            CoursePurchase.countDocuments({ status: "completed" }),
            CoursePurchase.aggregate([
                { $match: { status: "completed" } },
                { $group: { _id: null, totalPaisa: { $sum: "$platformFeePaisa" } } },
            ]),
            countInRange(User, "createdAt", windowStart, endExclusive),
            countInRange(User, "createdAt", previousWindowStart, previousWindowEndExclusive),
            countInRange(Question, "createdAt", windowStart, endExclusive),
            countInRange(Question, "createdAt", previousWindowStart, previousWindowEndExclusive),
            countInRange(Answer, "createdAt", windowStart, endExclusive),
            countInRange(Answer, "createdAt", previousWindowStart, previousWindowEndExclusive),
            countInRange(Enrollment, "createdAt", windowStart, endExclusive),
            countInRange(Enrollment, "createdAt", previousWindowStart, previousWindowEndExclusive),
            countInRange(CoursePurchase, "createdAt", windowStart, endExclusive, { status: "completed" }),
            countInRange(CoursePurchase, "createdAt", previousWindowStart, previousWindowEndExclusive, {
                status: "completed",
            }),
            revenueInRangePaisa(windowStart, endExclusive),
            revenueInRangePaisa(previousWindowStart, previousWindowEndExclusive),
        ]);
        const [userTrendMap, questionTrendMap, answerTrendMap, enrollmentTrendMap, purchaseTrendMap, revenueTrendMap,] = await Promise.all([
            dailyCountMap({ model: User, dateField: "createdAt", start: windowStart, endExclusive }),
            dailyCountMap({ model: Question, dateField: "createdAt", start: windowStart, endExclusive }),
            dailyCountMap({ model: Answer, dateField: "createdAt", start: windowStart, endExclusive }),
            dailyCountMap({ model: Enrollment, dateField: "createdAt", start: windowStart, endExclusive }),
            dailyCountMap({
                model: CoursePurchase,
                dateField: "createdAt",
                start: windowStart,
                endExclusive,
                match: { status: "completed" },
            }),
            dailyRevenueMap({ start: windowStart, endExclusive }),
        ]);
        const trends = [];
        for (let i = 0; i < windowDays; i += 1) {
            const date = addUtcDays(windowStart, i);
            const key = toIsoDay(date);
            trends.push({
                date: key,
                users: userTrendMap.get(key) || 0,
                questions: questionTrendMap.get(key) || 0,
                answers: answerTrendMap.get(key) || 0,
                enrollments: enrollmentTrendMap.get(key) || 0,
                purchases: purchaseTrendMap.get(key) || 0,
                revenueNpr: toNpr(revenueTrendMap.get(key) || 0),
            });
        }
        const [enrollmentByCourseRows, purchaseByCourseRows, reviewByCourseRows, publishedByInstructorRows] = await Promise.all([
            Enrollment.aggregate([
                { $group: { _id: "$courseId", enrollments: { $sum: 1 } } },
            ]),
            CoursePurchase.aggregate([
                { $match: { status: "completed" } },
                { $group: { _id: "$courseId", purchases: { $sum: 1 }, revenuePaisa: { $sum: "$paidAmountPaisa" } } },
            ]),
            CourseReview.aggregate([
                { $group: { _id: "$courseId", averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
            ]),
            Course.aggregate([
                { $match: { status: "Published" } },
                { $group: { _id: "$instructorId", publishedCourses: { $sum: 1 } } },
            ]),
        ]);
        const metricsByCourse = new Map();
        const ensureCourseMetric = (courseId) => {
            const existing = metricsByCourse.get(courseId);
            if (existing)
                return existing;
            const fresh = {
                enrollments: 0,
                purchases: 0,
                revenuePaisa: 0,
                averageRating: 0,
                reviewCount: 0,
            };
            metricsByCourse.set(courseId, fresh);
            return fresh;
        };
        for (const row of enrollmentByCourseRows) {
            const courseId = String(row._id || "");
            if (!courseId)
                continue;
            const m = ensureCourseMetric(courseId);
            m.enrollments = safeNumber(row.enrollments);
        }
        for (const row of purchaseByCourseRows) {
            const courseId = String(row._id || "");
            if (!courseId)
                continue;
            const m = ensureCourseMetric(courseId);
            m.purchases = safeNumber(row.purchases);
            m.revenuePaisa = safeNumber(row.revenuePaisa);
        }
        for (const row of reviewByCourseRows) {
            const courseId = String(row._id || "");
            if (!courseId)
                continue;
            const m = ensureCourseMetric(courseId);
            m.averageRating = safeNumber(row.averageRating);
            m.reviewCount = safeNumber(row.reviewCount);
        }
        const courseIds = Array.from(metricsByCourse.keys());
        const courses = courseIds.length > 0
            ? await Course.find({ _id: { $in: courseIds } }).select("_id title instructorId status").lean()
            : [];
        const publishedCourseDocs = courses.filter((c) => c.status === "Published");
        const instructorIdsFromCourses = Array.from(new Set(publishedCourseDocs.map((c) => String(c.instructorId || "")).filter(Boolean)));
        const instructorIdsFromPublishedCount = Array.from(new Set(publishedByInstructorRows.map((r) => String(r._id || "")).filter(Boolean)));
        const instructorIds = Array.from(new Set([...instructorIdsFromCourses, ...instructorIdsFromPublishedCount]));
        const instructors = instructorIds.length > 0
            ? await User.find({ _id: { $in: instructorIds } }).select("_id firstName lastName email").lean()
            : [];
        const instructorMap = new Map();
        for (const ins of instructors) {
            const id = String(ins._id || "");
            if (!id)
                continue;
            const firstName = String(ins.firstName || "");
            const lastName = String(ins.lastName || "");
            const fullName = `${firstName} ${lastName}`.trim() || "Instructor";
            instructorMap.set(id, { fullName, email: String(ins.email || "") });
        }
        const topCourses = publishedCourseDocs
            .map((course) => {
            const courseId = String(course._id || "");
            const m = metricsByCourse.get(courseId) || {
                enrollments: 0,
                purchases: 0,
                revenuePaisa: 0,
                averageRating: 0,
                reviewCount: 0,
            };
            const instructorId = String(course.instructorId || "");
            const ins = instructorMap.get(instructorId);
            return {
                id: courseId,
                title: String(course.title || "Untitled course"),
                instructorName: ins?.fullName || "Instructor",
                enrollments: m.enrollments,
                purchases: m.purchases,
                revenueNpr: toNpr(m.revenuePaisa),
                averageRating: toPct(m.averageRating),
                reviewCount: m.reviewCount,
            };
        })
            .sort((a, b) => {
            if (b.revenueNpr !== a.revenueNpr)
                return b.revenueNpr - a.revenueNpr;
            if (b.purchases !== a.purchases)
                return b.purchases - a.purchases;
            if (b.enrollments !== a.enrollments)
                return b.enrollments - a.enrollments;
            return b.averageRating - a.averageRating;
        })
            .slice(0, 5);
        const instructorMetrics = new Map();
        const ensureInstructorMetric = (id) => {
            const existing = instructorMetrics.get(id);
            if (existing)
                return existing;
            const fresh = {
                publishedCourses: 0,
                enrollments: 0,
                purchases: 0,
                revenuePaisa: 0,
            };
            instructorMetrics.set(id, fresh);
            return fresh;
        };
        for (const row of publishedByInstructorRows) {
            const instructorId = String(row._id || "");
            if (!instructorId)
                continue;
            const m = ensureInstructorMetric(instructorId);
            m.publishedCourses = safeNumber(row.publishedCourses);
        }
        for (const course of publishedCourseDocs) {
            const courseId = String(course._id || "");
            const instructorId = String(course.instructorId || "");
            if (!courseId || !instructorId)
                continue;
            const courseMetric = metricsByCourse.get(courseId);
            if (!courseMetric)
                continue;
            const m = ensureInstructorMetric(instructorId);
            m.enrollments += courseMetric.enrollments;
            m.purchases += courseMetric.purchases;
            m.revenuePaisa += courseMetric.revenuePaisa;
        }
        const topInstructors = Array.from(instructorMetrics.entries())
            .map(([id, metric]) => {
            const ins = instructorMap.get(id);
            return {
                id,
                name: ins?.fullName || "Instructor",
                email: ins?.email || "",
                publishedCourses: metric.publishedCourses,
                enrollments: metric.enrollments,
                purchases: metric.purchases,
                revenueNpr: toNpr(metric.revenuePaisa),
            };
        })
            .sort((a, b) => {
            if (b.revenueNpr !== a.revenueNpr)
                return b.revenueNpr - a.revenueNpr;
            if (b.purchases !== a.purchases)
                return b.purchases - a.purchases;
            if (b.enrollments !== a.enrollments)
                return b.enrollments - a.enrollments;
            return b.publishedCourses - a.publishedCourses;
        })
            .slice(0, 5);
        const recentPurchases = await CoursePurchase.find({ status: "completed" })
            .select("_id pidx userId instructorId courseId paidAmountPaisa pricePaisa platformFeePaisa instructorSharePaisa createdAt")
            .sort({ createdAt: -1 })
            .limit(12)
            .lean();
        const txUserIds = Array.from(new Set(recentPurchases
            .flatMap((tx) => [String(tx.userId || ""), String(tx.instructorId || "")])
            .filter(Boolean)));
        const txCourseIds = Array.from(new Set(recentPurchases.map((tx) => String(tx.courseId || "")).filter(Boolean)));
        const [txUsers, txCourses] = await Promise.all([
            txUserIds.length > 0
                ? User.find({ _id: { $in: txUserIds } }).select("_id firstName lastName email").lean()
                : Promise.resolve([]),
            txCourseIds.length > 0
                ? Course.find({ _id: { $in: txCourseIds } }).select("_id title").lean()
                : Promise.resolve([]),
        ]);
        const txUserMap = new Map();
        for (const u of txUsers) {
            const id = String(u._id || "");
            if (!id)
                continue;
            const firstName = String(u.firstName || "");
            const lastName = String(u.lastName || "");
            txUserMap.set(id, {
                name: `${firstName} ${lastName}`.trim() || "User",
                email: String(u.email || ""),
            });
        }
        const txCourseMap = new Map();
        for (const c of txCourses) {
            const id = String(c._id || "");
            if (!id)
                continue;
            txCourseMap.set(id, String(c.title || "Untitled course"));
        }
        const revenueTransactions = recentPurchases.map((tx) => {
            const learnerId = String(tx.userId || "");
            const instructorId = String(tx.instructorId || "");
            const courseId = String(tx.courseId || "");
            const grossPaisa = safeNumber(tx.paidAmountPaisa ?? tx.pricePaisa ?? 0);
            const platformFeePaisa = safeNumber(tx.platformFeePaisa);
            const instructorSharePaisa = safeNumber(tx.instructorSharePaisa);
            return {
                id: String(tx._id || ""),
                pidx: String(tx.pidx || ""),
                createdAt: tx.createdAt,
                course: {
                    id: courseId,
                    title: txCourseMap.get(courseId) || "Course",
                },
                learner: {
                    id: learnerId,
                    name: txUserMap.get(learnerId)?.name || "Learner",
                    email: txUserMap.get(learnerId)?.email || "",
                },
                instructor: {
                    id: instructorId,
                    name: txUserMap.get(instructorId)?.name || "Instructor",
                    email: txUserMap.get(instructorId)?.email || "",
                },
                grossAmountNpr: toNpr(grossPaisa),
                platformFeeNpr: toNpr(platformFeePaisa),
                instructorShareNpr: toNpr(instructorSharePaisa),
            };
        });
        const totalPlatformRevenuePaisa = safeNumber(totalRevenueAgg[0]?.totalPaisa);
        const answeredQuestionRate = totalQuestions > 0 ? toPct((answeredQuestions / totalQuestions) * 100) : 0;
        const verifiedAnswerRate = totalQuestions > 0 ? toPct((verifiedAnswerQuestions / totalQuestions) * 100) : 0;
        const averageAnswersPerQuestion = totalQuestions > 0 ? toPct(totalAnswers / totalQuestions) : 0;
        const courseCompletionRate = totalEnrollments > 0 ? toPct((completedEnrollments / totalEnrollments) * 100) : 0;
        const unansweredQuestions = Math.max(0, totalQuestions - answeredQuestions);
        const pendingTotal = pendingCourseApprovals + pendingInstructorVerifications;
        const revenueWindowNpr = toNpr(revenueInWindowPaisa);
        const previousRevenueWindowNpr = toNpr(revenueInPreviousWindowPaisa);
        const insights = [];
        if (pendingTotal > 0) {
            insights.push(`${pendingTotal} admin item(s) are pending review (${pendingCourseApprovals} course approvals, ${pendingInstructorVerifications} instructor verifications).`);
        }
        else {
            insights.push("No pending admin approvals right now.");
        }
        if (unansweredQuestions > 0) {
            insights.push(`${unansweredQuestions} question(s) are unanswered. Current answered-question rate is ${answeredQuestionRate}%.`);
        }
        const revenueGrowth = growthPct(revenueWindowNpr, previousRevenueWindowNpr);
        if (revenueWindowNpr > previousRevenueWindowNpr) {
            insights.push(`Revenue grew by ${revenueGrowth}% compared to the previous ${windowDays}-day window.`);
        }
        else if (revenueWindowNpr < previousRevenueWindowNpr) {
            insights.push(`Revenue is down by ${Math.abs(revenueGrowth)}% compared to the previous ${windowDays}-day window.`);
        }
        else {
            insights.push(`Revenue is flat versus the previous ${windowDays}-day window.`);
        }
        const userGrowth = growthPct(usersInWindow, usersInPreviousWindow);
        if (usersInWindow >= usersInPreviousWindow) {
            insights.push(`User growth is positive at ${userGrowth}% over the previous ${windowDays}-day period.`);
        }
        else {
            insights.push(`User growth slowed by ${Math.abs(userGrowth)}% over the previous ${windowDays}-day period.`);
        }
        return res.json({
            generatedAt: new Date().toISOString(),
            windowDays,
            summary: {
                totalUsers,
                totalStudents,
                totalInstructors,
                verifiedInstructors,
                totalQuestions,
                totalAnswers,
                totalCourses,
                publishedCourses,
                pendingCourseApprovals,
                pendingInstructorVerifications,
                totalEnrollments,
                completedEnrollments,
                totalPurchases,
                totalRevenueNpr: toNpr(totalPlatformRevenuePaisa),
                answeredQuestionRate,
                verifiedAnswerRate,
                averageAnswersPerQuestion,
                courseCompletionRate,
            },
            window: {
                startDate: toIsoDay(windowStart),
                endDate: toIsoDay(addUtcDays(windowStart, windowDays - 1)),
                users: usersInWindow,
                questions: questionsInWindow,
                answers: answersInWindow,
                enrollments: enrollmentsInWindow,
                purchases: purchasesInWindow,
                revenueNpr: revenueWindowNpr,
                previous: {
                    users: usersInPreviousWindow,
                    questions: questionsInPreviousWindow,
                    answers: answersInPreviousWindow,
                    enrollments: enrollmentsInPreviousWindow,
                    purchases: purchasesInPreviousWindow,
                    revenueNpr: previousRevenueWindowNpr,
                },
            },
            trends,
            topCourses,
            topInstructors,
            revenueTransactions,
            insights,
        });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load report insights";
        return res.status(500).json({ message });
    }
}
