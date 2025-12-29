// src/pages/QuestionsPage.tsx
import { useMemo, useState } from "react";
import QuestionsToolbar from "../components/questions/QuestionToolbar";
import QuestionsList from "../components/questions/QuestionList";
import Leaderboard from "../components/questions/Leaderboard";
import type { Question } from "../app/types/question.types";

const QuestionsPage = () => {
  const questions: Question[] = [
    {
      id: "q1",
      title: "How to solve quadratic equations using factorization?",
      excerpt:
        "I’m confused about selecting factors that add up to the middle term. Can someone show step-by-step for SEE-level?",
      subject: "Mathematics",
      level: "Class 10 (SEE)",
      tags: ["SEE", "Math", "Exam"],
      author: "Student A",
      authorType: "Student",
      answersCount: 4,
      views: 980,
      votes: 23,
      status: "Answered",
      createdAt: "2 days ago",
      hasVerifiedAnswer: true,
    },
    {
      id: "q2",
      title: "Explain Kirchhoff’s Laws with a numerical example",
      excerpt:
        "Need a clear explanation with one solved numerical for +2 Physics. Also how to apply sign convention properly?",
      subject: "Physics",
      level: "+2",
      tags: ["+2", "Physics", "Exam"],
      author: "Learner B",
      authorType: "Student",
      answersCount: 2,
      views: 620,
      votes: 12,
      status: "Answered",
      createdAt: "1 day ago",
    },
    {
      id: "q3",
      title: "Difference between debit and credit in accounting (simple)",
      excerpt:
        "I keep mixing debit and credit. Please explain with one example for each and a small rule to remember.",
      subject: "Accountancy",
      level: "+2",
      tags: ["+2", "Accountancy", "Notes"],
      author: "Student C",
      authorType: "Student",
      answersCount: 0,
      views: 210,
      votes: 5,
      status: "Unanswered",
      createdAt: "5 hours ago",
      isFastResponse: true,
    },
    {
      id: "q4",
      title: "Write an essay on environmental pollution (Class 9 format)",
      excerpt:
        "Need an exam-style essay structure with introduction, causes, effects and conclusion — around 250 words.",
      subject: "English",
      level: "Class 9",
      tags: ["Class 9", "English", "Exam"],
      author: "Tutor D",
      authorType: "Tutor",
      answersCount: 1,
      views: 410,
      votes: 7,
      status: "Answered",
      createdAt: "3 days ago",
    },
  ];

  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [level, setLevel] = useState("All");
  const [sort, setSort] = useState("Newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = questions.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q);

      const matchesSubject = subject === "All" || item.subject === subject;
      const matchesLevel = level === "All" || item.level === level;

      return matchesQuery && matchesSubject && matchesLevel;
    });

    if (sort === "Most Viewed") list = [...list].sort((a, b) => b.views - a.views);
    if (sort === "Most Voted") list = [...list].sort((a, b) => b.votes - a.votes);
    if (sort === "Unanswered") list = list.filter((x) => x.answersCount === 0);

    return list;
  }, [questions, query, subject, level, sort]);

  return (
    <div className="space-y-8">
      <QuestionsToolbar
        query={query}
        setQuery={setQuery}
        subject={subject}
        setSubject={setSubject}
        level={level}
        setLevel={setLevel}
        sort={sort}
        setSort={setSort}
        count={filtered.length}
      />

      {/* Left list + Right leaderboard */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <QuestionsList questions={filtered} />
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6">
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsPage;
