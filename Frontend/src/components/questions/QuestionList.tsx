// src/components/questions/QuestionsList.tsx
import type { Question } from "@/app/types/question.types";
import QuestionCard from "./QuestionCard";

const QuestionsList = ({ questions }: { questions: Question[] }) => {
  if (!questions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300">
        No questions found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  );
};

export default QuestionsList;