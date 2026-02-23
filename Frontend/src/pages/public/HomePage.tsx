import { Link } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import HeroImg from "@/assets/HeroIMG.png";
import RoleCard from "@/components/RoleCard";
import FeatureCard from "@/components/FeatureCard";
import ImpactCard from "@/components/ImpactCard";
import TestimonialsSection from "@/components/TestomonialsSection";


import {
  FaUserGraduate,
  FaQuestionCircle,
  FaChalkboardTeacher,
  FaCertificate,
  FaCheckCircle,
  FaBrain,
  FaComments,
} from "react-icons/fa";

import { PiCertificateFill } from "react-icons/pi";

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

function useInViewOnce<T extends HTMLElement>(threshold = 0.16) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return { ref, inView };
}

const Reveal = ({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${className} transform-gpu transition-all duration-700 ease-out will-change-transform ${
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const HomePage = () => {
  const learnersTarget = 12500;
  const questionsTarget = 48000;
  const tutorsTarget = 320;
  const certificatesTarget = 8900;

  const learners = useCountUp(learnersTarget);
  const questions = useCountUp(questionsTarget);
  const tutors = useCountUp(tutorsTarget);
  const certificates = useCountUp(certificatesTarget);

  return (
    <div className="mx-auto max-w-7xl space-y-20 px-4">
      {/* HERO */}
      <section className=" bg-surface p-10 border-base">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* LEFT */}
          <Reveal className="lg:col-span-7" delay={40}>
            <h1 className="text-5xl font-bold leading-tight text-basec sm:text-6xl lg:text-7xl">
              GyanLearnia
            </h1>

            <p className="mt-6 max-w-3xl text-base text-muted sm:text-lg">
              Learn with learners across Nepal by exploring courses, tackling
              exam-style practice, and getting verified Q&amp;A support.
            </p>

            <div className="mt-10 transition-transform duration-500 hover:-translate-y-1">
              <img src={HeroImg} alt="" className="w-full max-w-xl" />
            </div>
          </Reveal>

          {/* RIGHT CTA */}
          <Reveal className="lg:col-span-5" delay={120}>
            <div className="rounded-2xl bg-surface border border-base p-6 shadow-sm">
              <h2 className="text-3xl font-bold leading-tight text-basec">
                Start learning today by signing up!
              </h2>

              <div className="mt-6 space-y-4">
                <RoleCard to="/register?role=student" label="I'm a learner" />
                <RoleCard to="/register?role=instructor" label="I'm a teacher" />
              </div>

              <p className="mt-6 text-sm text-muted">
                Already have a GyanLearnia account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  Log in
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* IMPACT */}
      <section className="flex flex-col items-center justify-center">
        <Reveal>
          <h2 className="text-4xl font-bold leading-tight text-basec">Learning Impact</h2>
        </Reveal>

        <div className="mt-8 w-full">
          <div className="rounded-2xl border-base bg-surface p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Reveal delay={50}>
                <ImpactCard
                  icon={<FaUserGraduate className="text-indigo-600" />}
                  label="Learners"
                  value={`${learners.toLocaleString()}+`}
                  desc="Students & self-learners using the platform."
                />
              </Reveal>

              <Reveal delay={130}>
                <ImpactCard
                  icon={<FaQuestionCircle className="text-green-600" />}
                  label="Questions Answered"
                  value={`${questions.toLocaleString()}+`}
                  desc="Verified and community-upvoted answers."
                />
              </Reveal>

              <Reveal delay={210}>
                <ImpactCard
                  icon={<FaChalkboardTeacher className="text-blue-600" />}
                  label="Verified Tutors"
                  value={`${tutors.toLocaleString()}+`}
                  desc="Instructors available for guidance."
                />
              </Reveal>

              <Reveal delay={290}>
                <ImpactCard
                  icon={<FaCertificate className="text-orange-500" />}
                  label="Certificates Issued"
                  value={`${certificates.toLocaleString()}+`}
                  desc="Skill-based certification after completion."
                />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mt-20">
        <Reveal>
          <h2 className="text-center text-4xl font-bold leading-tight text-basec">
            Why GyanLearnia?
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal delay={40}>
            <FeatureCard
              icon={<FaCheckCircle className="text-green-500" />}
              title="Verified Answers"
              desc="Reliable, teacher-verified and upvoted academic answers."
            />
          </Reveal>

          <Reveal delay={120}>
            <FeatureCard
              icon={<FaBrain className="text-blue-500" />}
              title="Skill-Based Courses"
              desc="Academic, technical, and vocational learning with structure."
            />
          </Reveal>

          <Reveal delay={200}>
            <FeatureCard
              icon={<PiCertificateFill className="text-red-500" />}
              title="Certification"
              desc="Digital certificates after successful course completion."
            />
          </Reveal>

          <Reveal delay={280}>
            <FeatureCard
              icon={<FaComments className="text-orange-500" />}
              title="Fast Response"
              desc="Request priority academic support when time matters most."
            />
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <Reveal>
        <section className="w-full max-w-full overflow-x-hidden">
          <TestimonialsSection />
        </section>
      </Reveal>

      {/* CTA */}
      <Reveal delay={80}>
        <section className="relative overflow-hidden rounded-2xl border border-indigo-300/50 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 px-6 py-12 text-center text-white shadow-sm sm:px-10 dark:border-indigo-800/60 dark:from-indigo-900 dark:via-indigo-800 dark:to-slate-900">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),rgba(255,255,255,0)_58%)] dark:bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.24),rgba(129,140,248,0)_58%)]" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-100 dark:text-indigo-200">
              Take The Next Step
            </p>
            <h2 className="mt-3 text-5xl font-bold leading-tight text-white sm:text-6xl">
              Start Learning Today
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-base text-indigo-50/95 sm:text-lg dark:text-indigo-100/90">
              Join a growing learning ecosystem designed for Nepal&apos;s academic and
              skill-development needs.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:bg-indigo-100 dark:text-indigo-900 dark:hover:bg-indigo-200"
              >
                Create Free Account
              </Link>
              <Link
                to="/courses"
                className="rounded-lg border border-white/60 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 dark:border-indigo-300/30 dark:bg-white/10 dark:hover:bg-white/20"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
};

export default HomePage;
