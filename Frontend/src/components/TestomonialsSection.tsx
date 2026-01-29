import { useMemo } from "react";
import type { CSSProperties } from "react";
import { FaQuoteLeft } from "react-icons/fa";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
};

function TestimonialCard({ t }: { t: Testimonial }) {
  const initials =
    t.name
      .split(" ")
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "GL";

  return (
    <article className="relative flex h-[230px] w-full max-w-sm flex-col rounded-2xl border border-base bg-surface p-6 shadow-sm transition hover:shadow-md">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700 ring-1 ring-indigo-100">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-basec">{t.name}</p>
            <p className="truncate text-xs text-muted">{t.role}</p>
          </div>
        </div>

        <FaQuoteLeft className="shrink-0 text-indigo-600/80" />
      </div>

      {/* text (clamped) */}
      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted">
        {t.text}
      </p>
    </article>
  );
}

export default function TestimonialsSection() {
  const testimonials = useMemo<Testimonial[]>(
    () => [
      {
        id: "t1",
        name: "Pratibha Gurung",
        role: "Student",
        text:
          "The verified answers helped me a lot during exam preparation. The solution steps are clear and match our syllabus, so I can revise faster without confusion.",
      },
      {
        id: "t2",
        name: "Aayush Shrestha",
        role: "Learner",
        text:
          "I used the Q&A section for Physics numericals. The explanations are structured and easy to follow. The platform feels simple and focused—exactly what I needed.",
      },
      {
        id: "t3",
        name: "Nisha Tamang",
        role: "Instructor",
        text:
          "As an instructor, I like how questions are categorized by subject and level. It saves time and lets me respond to students who genuinely need help.",
      },
      {
        id: "t4",
        name: "Roshan Poudel",
        role: "Student",
        text:
          "Courses are organized well and the lessons are manageable. I also like the idea of certification after completion—it keeps me motivated.",
      },
      {
        id: "t5",
        name: "Salomi Kumari",
        role: "Learner",
        text:
          "Fast Response is a good concept when you are stuck the night before an exam. I can quickly post a question and get targeted help.",
      },
      {
        id: "t6",
        name: "Astha Sharma",
        role: "Verified Instructor",
        text:
          "The platform encourages quality answers. The verified badge concept makes it easier for students to trust responses and focus on correct learning.",
      },
      {
        id: "t7",
        name: "Srawan Shrestha",
        role: "Mentor",
        text:
          "The skill-based course idea is useful for students who want practical learning. Keeping the UI simple and clean makes it feel professional.",
      },
      {
        id: "t8",
        name: "Kriti Bista",
        role: "Student",
        text:
          "I like the exam-style structure. If notes and quick summaries are added later, it will be even better for last-minute revision.",
      },
    ],
    []
  );

  const swiperStyle: CSSProperties = {
    ["--swiper-pagination-color" as any]: "rgb(79 70 229)",
  };

  return (
    <section className="mt-20 w-full max-w-full overflow-x-hidden">
      <div className="flex w-full justify-center">
        <h2 className="text-center text-4xl font-bold text-basec">
          Students and Instructors Testimonials
        </h2>
      </div>

      <div className="mt-8 w-full max-w-full overflow-x-hidden">
        <Swiper
          modules={[Pagination, Autoplay]}
          autoplay={{ delay: 2500, disableOnInteraction: true }}
          pagination={{ clickable: true }}
          style={swiperStyle}
          spaceBetween={24}
          breakpoints={{
            0: { slidesPerView: 1 },
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="w-full !pb-12"
        >
          {testimonials.map((t) => (
            <SwiperSlide key={t.id} className="!h-auto">
              <div className="flex h-full justify-center">
                <TestimonialCard t={t} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
