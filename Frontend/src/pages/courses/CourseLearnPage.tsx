import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiAward,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiFileText,
  FiHelpCircle,
  FiPaperclip,
  FiPlayCircle,
  FiShare2,
  FiStar,
} from "react-icons/fi";
import {
  coursesApi,
  type CourseCertificate,
  type CourseProgress,
  type CourseQuiz,
  type CourseQuizResult,
  type CourseReview,
} from "@/app/api/courses.api";
import type { Question } from "@/app/types/question.types";
import { fetchCategories, type CategoryDTO } from "@/services/category";
import { createQuestion, fetchQuestions } from "@/services/questions";
import {
  type CourseListResponse,
  type CourseUiModel,
  type RelatedCourse,
  type LectureKind,
  type UiLecture,
  findLectureById,
  formatMin,
  parseApiError,
  pickInitialCourseLecture,
  toCourseRows,
  toUiCourse,
} from "./courseShared";
import Logo from "@/assets/icon.svg";

type LearnTab = "overview" | "qa" | "reviews";

const lessonIcon = (type: LectureKind) => {
  if (type === "Video") return <FiPlayCircle className="h-4 w-4" />;
  if (type === "File") return <FiPaperclip className="h-4 w-4" />;
  return <FiHelpCircle className="h-4 w-4" />;
};

const formatReviewTimeAgo = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (diffMs < month) {
    const days = Math.max(1, Math.floor(diffMs / day));
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (diffMs < year) {
    const months = Math.max(1, Math.floor(diffMs / month));
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.max(1, Math.floor(diffMs / year));
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

const formatInstructorCreatedDate = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const CourseLearnPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseUiModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [selectedLectureId, setSelectedLectureId] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [markingLectureId, setMarkingLectureId] = useState("");
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizData, setQuizData] = useState<CourseQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<CourseQuizResult | null>(null);
  const [progressMenuOpen, setProgressMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<LearnTab>("overview");
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<RelatedCourse[]>([]);
  const [instructorCoursesLoading, setInstructorCoursesLoading] = useState(false);
  const [qaQuestions, setQaQuestions] = useState<Question[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState("");
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewAverageRating, setReviewAverageRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const progressMenuRef = useRef<HTMLDivElement | null>(null);

  const loadProgress = async (courseId: string) => {
    try {
      setProgressLoading(true);
      const res = await coursesApi.progress(courseId);
      setProgress(res.item);
      return res.item;
    } finally {
      setProgressLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");
        setActionError("");

        const [coursePayload, progressPayload] = await Promise.all([
          coursesApi.getById(id),
          coursesApi.progress(id),
        ]);

        const mappedCourse = toUiCourse(coursePayload);
        if (!mappedCourse) {
          throw new Error("Course not found");
        }

        if (cancelled) return;

        setCourse(mappedCourse);
        setProgress(progressPayload.item);
        setOpenSections(
          mappedCourse.sections.reduce<Record<string, boolean>>((acc, section) => {
            acc[section.id] = true;
            return acc;
          }, {})
        );
      } catch (e: unknown) {
        if (cancelled) return;
        setError(parseApiError(e, "Failed to load course"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!course || !progress) return;

    const selectedLecture = findLectureById(course, selectedLectureId);
    if (selectedLecture) return;

    const nextLecture = pickInitialCourseLecture(course, progress.completedLectureIds);
    if (nextLecture) {
      setSelectedLectureId(nextLecture.id);
    }
  }, [course, progress, selectedLectureId]);

  const selectedLecture = useMemo(
    () => findLectureById(course, selectedLectureId),
    [course, selectedLectureId]
  );

  const completedLectureSet = useMemo(
    () => new Set(progress?.completedLectureIds ?? []),
    [progress?.completedLectureIds]
  );
  const progressCompletedCount = progress?.completedCount ?? 0;
  const progressTotalCount = progress?.totalCount ?? 0;
  const progressPercent = progress?.percent ?? 0;
  const courseDiscussionTag = useMemo(
    () => (course?.id ? `course:${course.id}` : ""),
    [course?.id]
  );
  const discussionCategory = useMemo(() => {
    if (!course) return null;
    const normalizedCourseCategory = course.category.trim().toLowerCase();
    return (
      categories.find((category) => category.name.trim().toLowerCase() === normalizedCourseCategory) ??
      null
    );
  }, [categories, course]);
  const sortedReviews = useMemo(
    () =>
      [...reviews].sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      }),
    [reviews]
  );
  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    for (const review of reviews) {
      const rating = Math.round(Number(review.rating || 0)) as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) counts[rating] += 1;
    }
    return ([5, 4, 3, 2, 1] as Array<1 | 2 | 3 | 4 | 5>).map((stars) => ({
      stars,
      count: counts[stars],
      percent: reviewsCount > 0 ? Math.round((counts[stars] / reviewsCount) * 100) : 0,
    }));
  }, [reviews, reviewsCount]);

  useEffect(() => {
    if (!course || !selectedLecture || selectedLecture.type !== "Quiz" || !selectedLecture.quizId) {
      setQuizLoading(false);
      setQuizData(null);
      setQuizAnswers({});
      setQuizResult(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setQuizLoading(true);
        setActionError("");
        setQuizResult(null);

        const res = await coursesApi.getQuiz(course.id, selectedLecture.quizId!);
        if (cancelled) return;

        setQuizData(res.item);
        setQuizAnswers(
          (res.item.questions || []).reduce<Record<string, string>>((acc, question) => {
            acc[question.id] = "";
            return acc;
          }, {})
        );
      } catch (e: unknown) {
        if (cancelled) return;
        setActionError(parseApiError(e, "Failed to load quiz"));
        setQuizData(null);
      } finally {
        if (!cancelled) setQuizLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [course, selectedLecture]);

  useEffect(() => {
    if (!progressMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!progressMenuRef.current?.contains(event.target as Node)) {
        setProgressMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [progressMenuOpen]);

  useEffect(() => {
    if (!shareCopied) return;
    const timer = window.setTimeout(() => setShareCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [shareCopied]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetchCategories();
        if (!cancelled) {
          setCategories(Array.isArray(res.items) ? res.items : []);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadCourseQuestions = async () => {
    if (!courseDiscussionTag) return;

    try {
      setQaLoading(true);
      setQaError("");
      const res = await fetchQuestions({ q: courseDiscussionTag, limit: 20 });
      const filtered = Array.isArray(res.items)
        ? res.items.filter((question) =>
            Array.isArray(question.tags) && question.tags.some((tag) => tag === courseDiscussionTag)
          )
        : [];
      setQaQuestions(filtered);
    } catch (e: unknown) {
      setQaQuestions([]);
      setQaError(parseApiError(e, "Failed to load course questions"));
    } finally {
      setQaLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "qa" || !courseDiscussionTag) return;
    void loadCourseQuestions();
  }, [activeTab, courseDiscussionTag]);

  const loadReviews = async (courseId: string) => {
    try {
      setReviewsLoading(true);
      setReviewsError("");
      const res = await coursesApi.getReviews(courseId);
      setReviews(Array.isArray(res.item.items) ? res.item.items : []);
      setReviewAverageRating(Number(res.item.averageRating || 0));
      setReviewsCount(Number(res.item.reviewsCount || 0));
    } catch (e: unknown) {
      setReviews([]);
      setReviewAverageRating(0);
      setReviewsCount(0);
      setReviewsError(parseApiError(e, "Failed to load reviews"));
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "reviews" || !course?.id) return;
    void loadReviews(course.id);
  }, [activeTab, course?.id]);

  useEffect(() => {
    if (!course?.instructorId) {
      setInstructorCourses([]);
      setInstructorCoursesLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setInstructorCoursesLoading(true);
        const data = (await coursesApi.list()) as CourseListResponse;
        if (cancelled) return;

        const rows = toCourseRows(data);
        const otherCourses = rows
          .filter((row) => row.id !== course.id && row.instructor?.id === course.instructorId)
          .slice(0, 4);

        setInstructorCourses(otherCourses);
      } catch {
        if (!cancelled) setInstructorCourses([]);
      } finally {
        if (!cancelled) setInstructorCoursesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [course?.id, course?.instructorId]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const shareCourse = async () => {
    if (!course) return;

    const courseUrl = `${window.location.origin}/courses/${course.id}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(courseUrl);
        setShareCopied(true);
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = courseUrl;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setShareCopied(true);
    } catch (e: unknown) {
      const message = parseApiError(e, "Failed to copy course link");
      setActionError(message);
    }
  };

  const submitCourseQuestion = async () => {
    if (!course || !discussionCategory || !courseDiscussionTag) return;

    const title = questionTitle.trim();
    const excerpt = questionBody.trim();

    if (title.length < 6) {
      setActionError("Question title must be at least 6 characters.");
      return;
    }

    if (excerpt.length < 12) {
      setActionError("Question details must be at least 12 characters.");
      return;
    }

    try {
      setQuestionSubmitting(true);
      setActionError("");
      await createQuestion({
        title,
        excerpt,
        categoryId: discussionCategory.id,
        level: course.level,
        tags: [courseDiscussionTag, course.title, course.category].filter(Boolean),
      });
      setQuestionTitle("");
      setQuestionBody("");
      await loadCourseQuestions();
    } catch (e: unknown) {
      setActionError(parseApiError(e, "Failed to post question"));
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const selectLecture = (lecture: UiLecture) => {
    setActionError("");
    setSelectedLectureId(lecture.id);
  };

  const downloadLectureResource = async (lecture: UiLecture) => {
    const resource = lecture.resources[0];
    if (!resource) {
      setActionError("No files are attached to this lesson yet.");
      return;
    }

    try {
      setActionError("");
      const response = await fetch(resource.url);
      if (!response.ok) {
        throw new Error("Failed to download file.");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = resource.name || lecture.title;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    } catch (e: unknown) {
      setActionError(parseApiError(e, "Failed to download file"));
    }
  };

  const completeLecture = async (lectureId: string) => {
    if (!course) return;

    try {
      setActionError("");
      setMarkingLectureId(lectureId);
      const res = await coursesApi.completeLecture(course.id, lectureId);
      setProgress((prev) =>
        prev
          ? {
              ...prev,
              ...res.item,
              enrolled: true,
              quizScores: prev.quizScores,
              certificateEligible: res.item.isCompleted && course.certificateEnabled,
            }
          : {
              enrolled: true,
              completedCount: res.item.completedCount,
              totalCount: res.item.totalCount,
              percent: res.item.percent,
              isCompleted: res.item.isCompleted,
              completedLectureIds: res.item.completedLectureIds,
              quizScores: {},
              certificateEligible: res.item.isCompleted && course.certificateEnabled,
            }
      );
    } catch (e: unknown) {
      setActionError(parseApiError(e, "Failed to mark lesson"));
    } finally {
      setMarkingLectureId("");
    }
  };

  const submitQuiz = async () => {
    if (!course || !quizData || !selectedLecture?.quizId) return;

    try {
      setQuizSubmitting(true);
      setActionError("");
      const res = await coursesApi.submitQuiz(course.id, quizData.id, quizAnswers);
      setQuizResult(res.item);
      await loadProgress(course.id);
    } catch (e: unknown) {
      setActionError(parseApiError(e, "Failed to submit quiz"));
    } finally {
      setQuizSubmitting(false);
    }
  };

  const openCertificate = async () => {
    if (!course) return;

    const win = window.open("", "_blank");
    if (!win) {
      setActionError("Popup blocked by browser. Please allow popups for this site.");
      return;
    }

    win.document.write(
      "<!doctype html><html><body style='font-family:Inter,Segoe UI,sans-serif;padding:24px'>Generating certificate...</body></html>"
    );
    win.document.close();

    try {
      setActionError("");
      setCertificateLoading(true);
      const res = await coursesApi.getCertificate(course.id);
      const cert: CourseCertificate = res.item;
      win.document.open();
      win.document.write(cert.html);
      win.document.close();
    } catch (e: unknown) {
      win.close();
      setActionError(parseApiError(e, "Failed to open certificate"));
    } finally {
      setCertificateLoading(false);
    }
  };

  const submitReview = async () => {
    if (!course) return;

    const comment = reviewComment.trim();
    if (comment.length < 3) {
      setActionError("Review comment must be at least 3 characters.");
      return;
    }

    try {
      setActionError("");
      setReviewSubmitting(true);
      await coursesApi.submitReview(course.id, { rating: reviewRating, comment });
      setReviewComment("");
      await loadReviews(course.id);
    } catch (e: unknown) {
      setActionError(parseApiError(e, "Failed to submit review"));
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Loading course workspace...</p>
          <p className="mt-2 text-sm text-gray-600">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <p className="text-lg font-semibold text-red-800">Could not open course</p>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Link
            to={id ? `/courses/${id}` : "/courses"}
            className="mt-5 inline-flex cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to Course Details
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-gray-900">Course not found</p>
          <p className="mt-2 text-sm text-gray-600">The course you are trying to open does not exist.</p>
          <Link
            to="/courses"
            className="mt-5 inline-flex cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!progressLoading && progress && !progress.enrolled) {
    return (
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Enrollment required</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">You need to enroll before opening the full course.</h1>
          <p className="mt-3 text-sm text-gray-700">
            Preview lessons stay available on the details page. Enroll first to unlock the full learner workspace.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to={`/courses/${course.id}`}
              className="inline-flex cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Back to Course Details
            </Link>
            <button
              type="button"
              onClick={() => navigate(`/courses/${course.id}`)}
              className="inline-flex cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              View Course Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myReview = reviews.find((review) => review.isMine);
  const canSubmitReview = Boolean(progress?.isCompleted) && !myReview;

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to="/courses"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 text-gray-900 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/5"
            >
              <img src={Logo} alt="GyanLearnia logo" className="h-8 w-auto" />
            </Link>

            <div className="hidden h-7 w-px bg-gray-200 dark:bg-white/10 md:block" />

            <div className="min-w-0">
              <Link
                to={`/courses/${course.id}`}
                className="block truncate text-sm font-semibold text-gray-900 transition hover:text-indigo-700 dark:text-white dark:hover:text-indigo-300 md:text-base"
              >
                {course.title}
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative" ref={progressMenuRef}>
              <button
                type="button"
                onClick={() => setProgressMenuOpen((prev) => !prev)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-white/5"
              >
                <span>Your progress</span>
                <FiChevronDown className={`h-4 w-4 transition ${progressMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {progressMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-slate-950">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Your progress</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {progressCompletedCount} of {progressTotalCount} complete
                  </p>

                  <div className="mt-4 h-2 rounded-full bg-gray-100 dark:bg-white/10">
                    <div
                      className="h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {course.certificateEnabled ? (
                    <button
                      type="button"
                      onClick={() => void openCertificate()}
                      disabled={!progress?.certificateEligible || certificateLoading}
                      className={[
                        "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                        progress?.certificateEligible && !certificateLoading
                          ? "cursor-pointer bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                          : "cursor-not-allowed border border-gray-300 bg-white text-gray-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-500",
                      ].join(" ")}
                    >
                      <FiAward className="h-4 w-4" />
                      {certificateLoading ? "Generating..." : "Certificate"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void shareCourse()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-white/5"
            >
              <FiShare2 className="h-4 w-4" />
              <span>{shareCopied ? "Copied" : "Share"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {actionError ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <main className="space-y-6">
            <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 dark:shadow-2xl">
              {!selectedLecture ? (
                <div className="grid min-h-[420px] place-items-center p-10 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">No lesson selected yet.</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                      Pick a lecture from the course content panel to start learning.
                    </p>
                  </div>
                </div>
              ) : selectedLecture.type === "Video" ? (
                selectedLecture.videoUrl ? (
                  <div className="space-y-0">
                    <video
                      key={selectedLecture.id}
                      src={selectedLecture.videoUrl}
                      controls
                      controlsList="nodownload"
                      onEnded={() => {
                        if (completedLectureSet.has(selectedLecture.id)) return;
                        if (markingLectureId === selectedLecture.id) return;
                        void completeLecture(selectedLecture.id);
                      }}
                      className="aspect-video w-full bg-black"
                    />
                    <div className="border-t border-gray-200 px-5 py-4 dark:border-white/10">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedLecture.title}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                          Video lesson
                          {selectedLecture.durationMin > 0 ? ` • ${selectedLecture.durationMin} min` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid min-h-[420px] place-items-center p-10 text-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">Video unavailable.</p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">This lesson does not have a playable video yet.</p>
                    </div>
                  </div>
                )
              ) : selectedLecture.type === "File" ? (
                <div className="p-6">
                  <div className="rounded-3xl bg-gray-50 p-6 dark:bg-white/5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                          <FiFileText className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedLecture.title}</p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                            Downloadable lesson resources
                            {selectedLecture.resources.length > 0
                              ? ` • ${selectedLecture.resources.length} file${selectedLecture.resources.length > 1 ? "s" : ""}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedLecture.resources.length === 0 ? (
                      <p className="mt-6 text-sm text-gray-600 dark:text-slate-300">No files are attached to this lesson yet.</p>
                    ) : (
                      <div className="mt-6 space-y-3">
                        {selectedLecture.resources.map((resource, idx) => (
                          <div
                            key={`${resource.url}-${idx}`}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{resource.name}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                {resource.sizeBytes > 0
                                  ? `${Math.max(1, Math.round(resource.sizeBytes / 1024))} KB`
                                  : "File"}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <a
                                href={resource.url}
                                download
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                              >
                                <FiDownload className="h-4 w-4" />
                                Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="rounded-3xl bg-white p-6 text-gray-900 dark:bg-slate-950/70 dark:text-white">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {quizData?.title || selectedLecture.title}
                        </h2>
                      </div>
                      {quizData ? (
                        <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-700 dark:bg-white/10 dark:text-slate-200">
                          Pass mark: <span className="font-semibold">{quizData.passPercent}%</span>
                        </div>
                      ) : null}
                    </div>

                    {quizLoading ? (
                      <p className="mt-6 text-sm text-gray-600 dark:text-slate-300">Loading quiz...</p>
                    ) : !quizData ? (
                      <p className="mt-6 text-sm text-red-600">Quiz unavailable.</p>
                    ) : (
                      <div className="mt-6 space-y-4">
                        {quizData.questions.map((question, questionIdx) => (
                          <div key={question.id} className="rounded-2xl border border-gray-200 p-4 dark:border-white/10 dark:bg-white/5">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {questionIdx + 1}. {question.prompt}
                            </p>

                            <div className="mt-3 space-y-2">
                              {question.options.map((option) => {
                                const detail = quizResult?.details.find((item) => item.questionId === question.id);
                                const isSelected = quizAnswers[question.id] === option.id;
                                const isCorrectOption = detail?.correctOptionId === option.id;
                                const reveal = Boolean(quizResult);

                                return (
                                  <label
                                    key={option.id}
                                    className={[
                                      "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm",
                                      reveal && isCorrectOption
                                        ? "border-green-300 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10"
                                        : reveal && isSelected && !isCorrectOption
                                          ? "border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
                                          : "border-gray-300 bg-white dark:border-white/10 dark:bg-slate-900 dark:text-slate-100",
                                    ].join(" ")}
                                  >
                                    <input
                                      type="radio"
                                      name={`quiz-${question.id}`}
                                      checked={isSelected}
                                      onChange={() =>
                                        !quizResult &&
                                        setQuizAnswers((prev) => ({ ...prev, [question.id]: option.id }))
                                      }
                                      disabled={Boolean(quizResult)}
                                    />
                                    <span>{option.text}</span>
                                  </label>
                                );
                              })}
                            </div>

                            {quizResult ? (
                              <p className="mt-3 text-xs text-gray-600 dark:text-slate-300">
                                {quizResult.details.find((item) => item.questionId === question.id)?.explanation ||
                                  "No explanation."}
                              </p>
                            ) : null}
                          </div>
                        ))}

                        {quizResult ? (
                          <div className="rounded-2xl bg-gray-50 p-4 text-sm dark:bg-white/5">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              Score: {quizResult.scorePercent}% ({quizResult.correctCount}/{quizResult.totalQuestions})
                            </p>
                            <p className={quizResult.passed ? "mt-1 text-green-700" : "mt-1 text-red-700"}>
                              {quizResult.passed ? "Passed" : "Failed"} (required {quizResult.passPercent}%)
                            </p>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap justify-end gap-2">
                          {quizResult ? (
                            <button
                              type="button"
                              onClick={() => {
                                setQuizResult(null);
                                setQuizAnswers(
                                  (quizData.questions || []).reduce<Record<string, string>>((acc, question) => {
                                    acc[question.id] = "";
                                    return acc;
                                  }, {})
                                );
                              }}
                              className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                            >
                              Retry
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => void submitQuiz()}
                            disabled={quizSubmitting || !quizData}
                            className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
                          >
                            {quizSubmitting ? "Submitting..." : "Submit Quiz"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:shadow-none">
              <div className="overflow-x-auto border-b border-gray-200 dark:border-white/10">
                <div className="flex min-w-max items-center gap-2 pb-3">
                  {([
                    { id: "overview", label: "Overview" },
                    { id: "qa", label: "Q&A" },
                    { id: "reviews", label: "Reviews" },
                  ] as Array<{ id: LearnTab; label: string }>).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={[
                        "cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition",
                        activeTab === tab.id
                          ? "bg-gray-900 text-white dark:bg-white dark:text-slate-950"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white",
                      ].join(" ")}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                {activeTab === "overview" ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-gray-50 p-5 dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h2>
                          {course.subtitle ? (
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600 dark:text-slate-300">
                              {course.subtitle}
                            </p>
                          ) : null}
                        </div>

                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/50">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">What you'll learn</h3>
                        <div className="mt-4 flex flex-col gap-3">
                          {course.outcomes.map((item, idx) => (
                            <p key={`${item}-${idx}`} className="inline-flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300">
                              <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                              <span>{item}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/50">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Requirements</h3>
                        <div className="mt-4 space-y-3">
                          {course.requirements.map((item, idx) => (
                            <p key={`${item}-${idx}`} className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300">
                              <span className="mt-1.5 h-2 w-2 rounded-full bg-gray-400 dark:bg-slate-500" />
                              <span>{item}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/50">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Course description</h3>
                      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600 dark:text-slate-300">
                        {course.description}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/50">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Instructor</h3>

                      <div className="mt-5 flex flex-col gap-6">
                        <div>
                          <div className="flex items-start gap-4">
                            {course.instructorAvatarUrl ? (
                              <img
                                src={course.instructorAvatarUrl}
                                alt={course.instructorName}
                                className="h-20 w-20 rounded-3xl object-cover ring-1 ring-gray-200 dark:ring-white/10"
                              />
                            ) : (
                              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gray-900 text-lg font-bold text-white dark:bg-white dark:text-slate-950">
                                {course.instructorName
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((word) => word[0]?.toUpperCase())
                                  .join("")}
                              </div>
                            )}

                            <div>
                              <p className="text-base font-semibold text-gray-900 dark:text-white">{course.instructorName}</p>
                              {course.instructorJoinedAt ? (
                                <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                                  Joined in {formatInstructorCreatedDate(course.instructorJoinedAt)}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-6">
                            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600 dark:text-slate-300">
                              {course.instructorBio?.trim() || "This instructor has not added a bio yet."}
                            </p>
                          </div>
                        </div>

                        {instructorCoursesLoading || instructorCourses.length > 0 ? (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              Other courses by {course.instructorName}
                            </h4>

                            {instructorCoursesLoading ? (
                              <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">Loading courses...</p>
                            ) : (
                              <div className="mt-3 space-y-3">
                                {instructorCourses.map((item) => {
                                  const priceText =
                                    Number(item.price || 0) > 0
                                      ? `NPR ${Number(item.price).toLocaleString()}`
                                      : "Free";
                                  const totalMinutes = Math.max(
                                    0,
                                    Math.round(Number(item.totalVideoSec || 0) / 60)
                                  );

                                  return (
                                    <Link
                                      key={item.id}
                                      to={`/courses/${item.id}`}
                                      className="block rounded-xl border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
                                    >
                                      <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                                        {item.title}
                                      </p>
                                      <p className="mt-1 text-xs text-gray-600 dark:text-slate-300">
                                        {item.category} • {item.level}
                                      </p>
                                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                        {Number(item.totalLectures || 0)} lecture{Number(item.totalLectures || 0) === 1 ? "" : "s"}
                                        {totalMinutes > 0 ? ` • ${formatMin(totalMinutes)}` : ""}
                                      </p>
                                      <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">{priceText}</p>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : activeTab === "qa" ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/50">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Course Q&A</h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                        Ask course-specific questions here. Learners can open the discussion thread and reply from the Q&A system.
                      </p>

                      {discussionCategory ? (
                        <div className="mt-5 grid gap-4">
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                              Question title
                            </label>
                            <input
                              value={questionTitle}
                              onChange={(e) => setQuestionTitle(e.target.value)}
                              placeholder="What do you need help understanding?"
                              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                              Details
                            </label>
                            <textarea
                              value={questionBody}
                              onChange={(e) => setQuestionBody(e.target.value)}
                              rows={4}
                              placeholder="Describe the lesson, concept, or problem you need help with."
                              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => void submitCourseQuestion()}
                              disabled={questionSubmitting}
                              className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
                            >
                              {questionSubmitting ? "Posting..." : "Ask Question"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                          Question posting is unavailable until a matching category is configured for this course.
                        </p>
                      )}
                    </div>

                    {qaLoading ? (
                      <p className="text-sm text-gray-600 dark:text-slate-300">Loading course questions...</p>
                    ) : qaError ? (
                      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                        {qaError}
                      </p>
                    ) : qaQuestions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-white/10 dark:text-slate-300">
                        No course questions yet. Ask the first one.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {qaQuestions.map((question) => (
                          <div key={question.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/50">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <Link
                                  to={`/questions/${question.id}`}
                                  className="text-base font-semibold text-gray-900 hover:text-indigo-700 dark:text-white dark:hover:text-indigo-300"
                                >
                                  {question.title}
                                </Link>
                                <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-slate-300">
                                  {question.excerpt}
                                </p>
                              </div>
                              <div className="shrink-0 text-right text-xs text-gray-500 dark:text-slate-400">
                                <p>{question.answersCount} answers</p>
                                <p className="mt-1">{new Date(question.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                                <span>Asked by {question.author}</span>
                                {question.tags
                                  .filter((tag) => tag !== courseDiscussionTag)
                                  .slice(0, 3)
                                  .map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700 dark:bg-white/5 dark:text-slate-300"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                              </div>

                              <Link
                                to={`/questions/${question.id}`}
                                className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
                              >
                                Open thread
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/50">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Student feedback</h3>

                      {reviewsCount > 0 ? (
                        <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
                          <div className="text-center lg:text-left">
                            <p className="text-7xl font-bold leading-none text-amber-600 dark:text-amber-300">
                              {reviewAverageRating.toFixed(1)}
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-1 lg:justify-start">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <FiStar
                                  key={idx}
                                  className={[
                                    "h-5 w-5",
                                    idx < Math.round(reviewAverageRating)
                                      ? "fill-current text-amber-500"
                                      : "text-amber-300/70 dark:text-amber-100/30",
                                  ].join(" ")}
                                />
                              ))}
                            </div>
                            <p className="mt-3 text-lg font-semibold text-amber-700 dark:text-amber-200">
                              Course rating
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                              {reviewsCount.toLocaleString()} review{reviewsCount === 1 ? "" : "s"}
                            </p>
                          </div>

                          <div className="space-y-4">
                            {ratingBreakdown.map((item) => (
                              <div key={item.stars} className="grid grid-cols-[minmax(0,1fr)_160px] items-center gap-4">
                                <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-slate-400 dark:bg-slate-300/70"
                                    style={{ width: `${item.percent}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <div className="flex items-center gap-1 text-amber-500">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                      <FiStar
                                        key={idx}
                                        className={[
                                          "h-4 w-4",
                                          idx < item.stars
                                            ? "fill-current"
                                            : "text-amber-300/60 dark:text-amber-100/20",
                                        ].join(" ")}
                                      />
                                    ))}
                                  </div>
                                  <span className="min-w-10 text-right font-semibold text-indigo-700 dark:text-indigo-300">
                                    {item.percent}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">No reviews yet.</p>
                      )}
                    </div>

                    {canSubmitReview ? (
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Leave your review</h4>
                        <div className="mt-4 grid gap-4 sm:grid-cols-12">
                          <div className="sm:col-span-3">
                            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                              Rating
                            </label>
                            <select
                              value={reviewRating}
                              onChange={(e) => setReviewRating(Number(e.target.value || 5))}
                              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                            >
                              <option value={5}>5 - Excellent</option>
                              <option value={4}>4 - Good</option>
                              <option value={3}>3 - Average</option>
                              <option value={2}>2 - Poor</option>
                              <option value={1}>1 - Very Poor</option>
                            </select>
                          </div>

                          <div className="sm:col-span-9">
                            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                              Comment
                            </label>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              rows={4}
                              placeholder="Share your learning experience from this course..."
                              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void submitReview()}
                            disabled={reviewSubmitting}
                            className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
                          >
                            {reviewSubmitting ? "Submitting..." : "Submit Review"}
                          </button>
                        </div>
                      </div>
                    ) : myReview ? (
                      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-200">
                        You have already submitted a review for this course.
                      </div>
                    ) : !progress?.isCompleted ? (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        Finish the course to unlock review submission.
                      </div>
                    ) : null}

                      <div className="space-y-4">
                      {reviewsLoading ? (
                        <p className="text-sm text-gray-600 dark:text-slate-300">Loading reviews...</p>
                      ) : reviewsError ? (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                          {reviewsError}
                        </p>
                      ) : reviews.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-white/10 dark:text-slate-300">
                          No reviews yet.
                        </div>
                      ) : (
                        sortedReviews.map((review) => {
                          const avatarLabel = review.user.name
                            .split(" ")
                            .slice(0, 2)
                            .map((word) => word[0]?.toUpperCase())
                            .join("");

                          return (
                            <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/50">
                              <div className="flex items-start gap-4">
                                {review.user.avatarUrl ? (
                                  <img
                                    src={review.user.avatarUrl}
                                    alt={review.user.name}
                                    className="h-14 w-14 rounded-full object-cover ring-1 ring-gray-200 dark:ring-white/10"
                                  />
                                ) : (
                                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gray-900 text-lg font-bold text-white dark:bg-white dark:text-slate-950">
                                    {avatarLabel || "U"}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{review.user.name}</p>
                                    <div className="flex items-center gap-1 text-amber-500">
                                      {Array.from({ length: 5 }).map((_, idx) => (
                                        <FiStar
                                          key={idx}
                                          className={[
                                            "h-4 w-4",
                                            idx < Math.round(Number(review.rating || 0))
                                              ? "fill-current"
                                              : "text-amber-300/60 dark:text-amber-100/20",
                                          ].join(" ")}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-slate-400">
                                      {formatReviewTimeAgo(review.updatedAt || review.createdAt)}
                                    </span>
                                  </div>

                                  <p className="mt-4 text-base leading-8 text-gray-700 dark:text-slate-300">
                                    {review.comment}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </main>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">Course content</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    {course.sections.length} sections • {course.lessons} lectures
                  </p>
                </div>
                {progressLoading ? <p className="text-xs text-gray-500 dark:text-slate-400">Refreshing...</p> : null}
              </div>

              <div className="mt-4 space-y-3">
                {course.sections.map((section, idx) => {
                  const isOpen = Boolean(openSections[section.id]);
                  const sectionMinutes = section.lectures.reduce((sum, lecture) => sum + lecture.durationMin, 0);

                  return (
                    <div key={section.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 dark:border-white/10 dark:bg-white/5">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-white/5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Section {idx + 1}: {section.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                            {section.lectures.length} lectures • {formatMin(sectionMinutes)}
                          </p>
                        </div>
                        {isOpen ? (
                          <FiChevronUp className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                        ) : (
                          <FiChevronDown className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                        )}
                      </button>

                      {isOpen ? (
                        <div className="border-t border-gray-200 dark:border-white/10">
                          {section.lectures.map((lecture) => {
                            const isSelected = selectedLectureId === lecture.id;
                            const isCompleted = completedLectureSet.has(lecture.id);
                            const isFileLecture = lecture.type === "File";
                            const rowClassName = [
                              "flex w-full items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 dark:border-white/5",
                              isSelected ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-gray-100 dark:hover:bg-white/5",
                            ].join(" ");

                            const rowContent = (
                              <>
                                <div className="flex min-w-0 items-start gap-3">
                                  <span
                                    className={[
                                      "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1",
                                      isSelected
                                        ? "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20"
                                        : "bg-white text-gray-500 ring-gray-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10",
                                    ].join(" ")}
                                  >
                                    {lessonIcon(lecture.type)}
                                  </span>
                                  <div className="min-w-0">
                                    {isFileLecture ? (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void downloadLectureResource(lecture);
                                        }}
                                        className="cursor-pointer truncate text-left text-sm font-semibold text-indigo-700 transition hover:text-indigo-800 hover:underline dark:text-indigo-300 dark:hover:text-indigo-200"
                                      >
                                        {lecture.title}
                                      </button>
                                    ) : (
                                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{lecture.title}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                      {lecture.type}
                                      {lecture.durationMin > 0 ? ` • ${lecture.durationMin} min` : ""}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex shrink-0 flex-col items-end gap-2">
                                  {isCompleted ? (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                      Completed
                                    </span>
                                  ) : null}
                                </div>
                              </>
                            );

                            return isFileLecture ? (
                              <div key={lecture.id} className={rowClassName}>
                                {rowContent}
                              </div>
                            ) : (
                              <button
                                key={lecture.id}
                                type="button"
                                onClick={() => selectLecture(lecture)}
                                className={`${rowClassName} cursor-pointer`}
                              >
                                {rowContent}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseLearnPage;
