import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
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
    <div className="mx-auto max-w-7xl space-y-20 px-4 overflow-x-hidden">
      {/* HERO */}
      <section className="rounded-2xl bg-surface p-10 shadow-sm border border-base">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* LEFT */}
          <div className="lg:col-span-7">
            <h1 className="text-4xl font-bold leading-tight text-basec sm:text-5xl">
              GyanLearnia
            </h1>

            <p className="mt-4 max-w-2xl text-lg text-muted">
              Learn with learners across Nepal by exploring courses, tackling
              exam-style practice, and getting verified Q&amp;A support.
            </p>

            <div className="mt-10">
              <img src={HeroImg} alt="" className="w-full max-w-xl" />
            </div>
          </div>

          {/* RIGHT CTA */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-surface border border-base p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-basec">
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
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section className="flex flex-col items-center justify-center">
        <h2 className="text-4xl font-bold text-basec">Learning Impact</h2>

        <div className="mt-8 w-full">
          <div className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <ImpactCard
                icon={<FaUserGraduate className="text-indigo-600" />}
                label="Learners"
                value={`${learners.toLocaleString()}+`}
                desc="Students & self-learners using the platform."
              />

              <ImpactCard
                icon={<FaQuestionCircle className="text-green-600" />}
                label="Questions Answered"
                value={`${questions.toLocaleString()}+`}
                desc="Verified and community-upvoted answers."
              />

              <ImpactCard
                icon={<FaChalkboardTeacher className="text-blue-600" />}
                label="Verified Tutors"
                value={`${tutors.toLocaleString()}+`}
                desc="Instructors available for guidance."
              />

              <ImpactCard
                icon={<FaCertificate className="text-orange-500" />}
                label="Certificates Issued"
                value={`${certificates.toLocaleString()}+`}
                desc="Skill-based certification after completion."
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mt-20">
        <h2 className="text-center text-4xl font-bold text-basec">
          Why GyanLearnia?
        </h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<FaCheckCircle className="text-green-500" />}
            title="Verified Answers"
            desc="Reliable, teacher-verified and upvoted academic answers."
          />

          <FeatureCard
            icon={<FaBrain className="text-blue-500" />}
            title="Skill-Based Courses"
            desc="Academic, technical, and vocational learning with structure."
          />

          <FeatureCard
            icon={<PiCertificateFill className="text-red-500" />}
            title="Certification"
            desc="Digital certificates after successful course completion."
          />

          <FeatureCard
            icon={<FaComments className="text-orange-500" />}
            title="Fast Response"
            desc="Request priority academic support when time matters most."
          />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="w-full max-w-full overflow-x-hidden">
        <TestimonialsSection />
      </section>

      {/* CTA (kept as strong dark block) */}
      <section className="rounded-2xl bg-gray-900 p-10 text-center text-white">
        <h2 className="text-2xl font-bold">Start Learning Today</h2>
        <p className="mx-auto mt-3 max-w-xl text-gray-300">
          Join a growing learning ecosystem designed for Nepal’s academic and
          skill-development needs.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/register"
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100"
          >
            Create Free Account
          </Link>
          <Link
            to="/courses"
            className="rounded-lg border border-gray-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Browse Courses
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
