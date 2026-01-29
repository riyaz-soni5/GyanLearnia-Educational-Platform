import { useMemo, useState } from "react";
import CourseCard from "../components/courses/CourseCard";
import CourseFilters from "../components/courses/CourseFilters";
import type { Course } from "../app/types/course.type";

const CoursesPage = () => {

  const courses: Course[] = [
    {
      id: "c1",
      title: "Mathematics (Class 10 - SEE)",
      subtitle: "Algebra, Geometry, Trigonometry — exam-focused practice",
      level: "Class 10 (SEE)",
      type: "Academic",
      priceType: "Free",
      rating: 4.6,
      lessons: 24,
      hours: 18,
      instructorName: "Verified Teacher",
      enrolled: 5320,
      badge: "Popular",
    },
    {
      id: "c2",
      title: "Physics (+2) — Mechanics",
      subtitle: "Concept + numericals with structured notes",
      level: "+2",
      type: "Academic",
      priceType: "Paid",
      priceNpr: 1499,
      rating: 4.7,
      lessons: 30,
      hours: 22,
      instructorName: "Astha Sharma",
      enrolled: 2180,
      badge: "Certified",
    },
    {
      id: "c3",
      title: "Web Development (MERN Basics)",
      subtitle: "HTML, CSS, JS, React essentials + mini projects",
      level: "Skill",
      type: "Technical",
      priceType: "Paid",
      priceNpr: 1999,
      rating: 4.5,
      lessons: 28,
      hours: 20,
      instructorName: "Srawan Shrestha",
      enrolled: 1630,
      badge: "New",
    },
    {
      id: "c4",
      title: "Accounting (+2) — Fundamentals",
      subtitle: "Ledger, journal entries, trial balance, practice sets",
      level: "+2",
      type: "Academic",
      priceType: "Free",
      rating: 4.3,
      lessons: 18,
      hours: 12,
      instructorName: "Verified Teacher",
      enrolled: 980,
    },
    {
      id: "c5",
      title: "Basic Graphic Design",
      subtitle: "Design principles + Canva workflow (beginner friendly)",
      level: "Skill",
      type: "Vocational",
      priceType: "Paid",
      priceNpr: 999,
      rating: 4.4,
      lessons: 16,
      hours: 10,
      instructorName: "Verified Instructor",
      enrolled: 720,
      badge: "Certified",
    },
    {
      id: "c6",
      title: "English (Class 9)",
      subtitle: "Grammar + writing formats + guided reading",
      level: "Class 9",
      type: "Academic",
      priceType: "Free",
      rating: 4.2,
      lessons: 14,
      hours: 9,
      instructorName: "Verified Teacher",
      enrolled: 1250,
    },
  ];

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("All");
  const [type, setType] = useState<string>("All");
  const [price, setPrice] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return courses.filter((c) => {
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q);

      const matchesLevel = level === "All" || c.level === level;
      const matchesType = type === "All" || c.type === type;
      const matchesPrice = price === "All" || c.priceType === price;

      return matchesQuery && matchesLevel && matchesType && matchesPrice;
    });
  }, [courses, query, level, type, price]);

  const handleReset = () => {
    setQuery("");
    setLevel("All");
    setType("All");
    setPrice("All");
  };

  return (
    <div className="space-y-8">
      <CourseFilters
        query={query}
        setQuery={setQuery}
        level={level}
        setLevel={setLevel}
        type={type}
        setType={setType}
        price={price}
        setPrice={setPrice}
        onReset={handleReset}
        resultCount={filtered.length}
      />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </section>

      {/* Static pagination placeholder */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <p className="text-sm text-gray-600">
          Page <span className="font-medium text-gray-900">1</span> of{" "}
          <span className="font-medium text-gray-900">1</span>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            1
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
