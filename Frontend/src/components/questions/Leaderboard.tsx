// src/components/questions/Leaderboard.tsx
type Leader = {
  name: string;
  role: "Tutor" | "Instructor" | "Student";
  points: number;
  answers: number;
};

const Leaderboard = () => {
  const leaders: Leader[] = [
    { name: "Astha Sharma", role: "Instructor", points: 1240, answers: 86 },
    { name: "Srawan Shrestha", role: "Instructor", points: 980, answers: 65 },
    { name: "Tutor D", role: "Tutor", points: 860, answers: 54 },
    { name: "Student A", role: "Student", points: 620, answers: 41 },
  ];

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Leaderboard</h3>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          This Week
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-600">
        Top contributors based on answers & points (static).
      </p>

      <div className="mt-4 space-y-3">
        {leaders.map((u, idx) => (
          <div
            key={u.name}
            className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                <span className="mr-2 text-gray-500">#{idx + 1}</span>
                {u.name}
              </p>
              <p className="mt-0.5 text-xs text-gray-600">{u.role}</p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{u.points}</p>
              <p className="text-xs text-gray-500">{u.answers} answers</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4">
        <p className="text-xs text-gray-600">
          Tip: Verified tutors earn more points for verified answers.
        </p>
      </div>
    </aside>
  );
};

export default Leaderboard;
