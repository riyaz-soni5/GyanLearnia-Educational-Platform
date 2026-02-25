import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FiCheckCircle,
  FiLinkedin,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { FaFacebookF, FaGoogle, FaInstagram, FaTwitter } from "react-icons/fa";
import FounderImg from "@/assets/FounderImg.png";

const storySteps = [
  {
    period: "2024",
    title: "Started with one local problem",
    desc: "Learners in Nepal needed trusted, affordable, and practical learning in one platform.",
    highlights: [
      "Observed fragmented online learning resources",
      "Focused on trust, affordability, and outcomes",
    ],
  },
  {
    period: "2025",
    title: "Built quality-first systems",
    desc: "We introduced instructor verification and course approval to protect learner trust.",
    highlights: [
      "Launched instructor verification pipeline",
      "Added structured course quality approvals",
    ],
  },
  {
    period: "2026",
    title: "Scaled to a wider classroom",
    desc: "Now we are growing as a Nepal-rooted platform with global-quality learning standards.",
    highlights: [
      "Expanded learning pathways and mentorship",
      "Strengthened Nepal-first, global-ready model",
    ],
  },
];

const differentiators = [
  {
    title: "Verified instructors",
    desc: "Identity and quality checks before instructors teach.",
    icon: <FiShield className="h-5 w-5" />,
  },
  {
    title: "Quality course approvals",
    desc: "Published courses follow clear review standards.",
    icon: <FiCheckCircle className="h-5 w-5" />,
  },
  {
    title: "Career-focused learning",
    desc: "Project-based skills that connect directly to opportunities.",
    icon: <FiTrendingUp className="h-5 w-5" />,
  },
  {
    title: "Community mentorship",
    desc: "Students, teachers, and mentors learn together.",
    icon: <FiUsers className="h-5 w-5" />,
  },
];

function useInViewOnce<T extends HTMLElement>(threshold = 0.18) {
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

const AboutPage = () => {
  return (
    <div className="space-y-10">
      <section className="relative -mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
        <div className="relative flex min-h-[76vh] items-center justify-center px-6 py-24 text-center">
          <Reveal className="relative z-10 mx-auto max-w-5xl" delay={80}>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted">Our Mission</p>
            <h1 className="mt-5 text-5xl font-bold leading-tight text-basec sm:text-6xl lg:text-7xl">
              Making a world of great
              <br className="hidden sm:block" />
              problem solvers
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base text-muted sm:text-lg">
              GyanLearnia empowers learners to think clearly, solve real problems, and build practical skills that
              create long-term career impact.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4">
        <Reveal>
          <section className="rounded-2xl bg-surface p-8 sm:p-10">
            <h2 className="text-center text-4xl font-bold text-basec">Our Story</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted">
              From Nepal classrooms to a digital-first ecosystem, this is the journey behind GyanLearnia.
            </p>
            <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" />

            <div className="relative mt-10">
              <div className="absolute left-1/2 top-0 hidden h-full w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-500 md:block" />

              <div className="space-y-8">
                {storySteps.map((item, idx) => {
                  const isLeft = idx % 2 === 0;

                  return (
                    <Reveal
                      key={item.period}
                      className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-8"
                      delay={idx * 120}
                    >
                      <div className={isLeft ? "md:col-start-1 md:text-right" : "md:col-start-1"}>
                        {isLeft ? (
                          <article className="rounded-2xl border border-base bg-surface p-5">
                            <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                              {item.period}
                            </p>
                            <h3 className="mt-3 text-2xl font-bold text-basec">{item.title}</h3>
                            <p className="mt-2 text-sm text-muted">{item.desc}</p>
                            <ul className="mt-3 space-y-1 text-sm text-muted">
                              {item.highlights.map((point) => (
                                <li key={point}>- {point}</li>
                              ))}
                            </ul>
                          </article>
                        ) : null}
                      </div>

                      <div className="hidden md:col-start-2 md:flex md:items-start md:justify-center">
                        <div className="relative z-10 mt-2 grid h-10 w-10 place-items-center rounded-full border-4 border-surface bg-indigo-600 text-sm font-bold text-white shadow-[0_0_0_6px_rgba(99,102,241,0.2)]">
                          {idx + 1}
                        </div>
                      </div>

                      <div className={!isLeft ? "md:col-start-3 md:text-left" : "md:col-start-3"}>
                        {!isLeft ? (
                          <article className="rounded-2xl border border-base bg-surface p-5">
                            <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                              {item.period}
                            </p>
                            <h3 className="mt-3 text-2xl font-bold text-basec">{item.title}</h3>
                            <p className="mt-2 text-sm text-muted">{item.desc}</p>
                            <ul className="mt-3 space-y-1 text-sm text-muted">
                              {item.highlights.map((point) => (
                                <li key={point}>- {point}</li>
                              ))}
                            </ul>
                          </article>
                        ) : null}
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={60}>
          <section className="rounded-2xl bg-surface p-8">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <img src={FounderImg} alt="Riyaj Soni" className="h-full w-full rounded-xl object-cover" />
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-surface p-2">
                  <p className="text-7xl font-black leading-none text-indigo-600">“</p>
                  <p className="mt-2 text-lg leading-8 text-muted">
                    We are building GyanLearnia to transform learning through trust, quality, and practical outcomes.
                    Our goal is to create a platform where students, educators, and institutions can grow together with
                    world-class digital learning designed for Nepal and ready for global impact.
                  </p>
                  <div className="mt-6 border-t border-base pt-4">
                    <p className="text-lg font-bold text-basec">Riyaj Soni</p>
                    <p className="text-sm font-semibold text-indigo-700">Founder & Product Lead</p>
                    <a
                      href="#"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                    >
                      <FiLinkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        <div className="space-y-0">
          <Reveal>
            <section className="rounded-t-2xl rounded-b-none bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 px-6 py-12 text-white shadow-sm sm:px-10">
              <h2 className="text-center text-5xl font-bold leading-tight">We believe</h2>
              <p className="mx-auto mt-4 max-w-3xl text-center text-2xl font-semibold text-indigo-100">
                Learning is the source of human progress.
              </p>

              <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                {differentiators.map((item, idx) => (
                  <Reveal key={item.title} className="text-center" delay={idx * 100}>
                    <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white">
                      {item.icon}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-indigo-100">{item.desc}</p>
                  </Reveal>
                ))}
              </div>

              <p className="mt-12 text-center text-lg font-semibold text-white">
                So that anyone, anywhere has the power to transform their lives through learning.
              </p>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section className="relative rounded-t-none rounded-b-2xl px-2 pb-6 pt-10 sm:px-4">
              <div className="absolute inset-x-0 top-0 h-40 rounded-b-2xl rounded-t-none bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400" />
              <div className="relative">
                <div className="mx-auto max-w-5xl rounded-2xl border border-base bg-surface p-6 shadow-xl sm:p-10">
                  <h2 className="text-center text-4xl font-bold text-basec">Get in Touch</h2>
                  <p className="mt-3 text-center text-sm text-muted">
                    Share your goals with us and we will help you find the right learning path.
                  </p>

                  <form
                    className="mt-8 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wide text-muted">
                          First Name
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          placeholder="Please enter first name..."
                          className="mt-2 w-full rounded-lg border border-base bg-surface px-4 py-3 text-sm text-basec placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          placeholder="Please enter last name..."
                          className="mt-2 w-full rounded-lg border border-base bg-surface px-4 py-3 text-sm text-basec placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Please enter email..."
                          className="mt-2 w-full rounded-lg border border-base bg-surface px-4 py-3 text-sm text-basec placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="Please enter phone number..."
                          className="mt-2 w-full rounded-lg border border-base bg-surface px-4 py-3 text-sm text-basec placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="text-xs font-semibold uppercase tracking-wide text-muted">
                        What do you have in mind
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        placeholder="Please enter query..."
                        className="mt-2 w-full resize-y rounded-lg border border-base bg-surface px-4 py-3 text-sm text-basec placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="mt-2 w-full rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Submit
                    </button>
                  </form>
                </div>
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
