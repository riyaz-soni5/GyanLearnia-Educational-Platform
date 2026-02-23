type Item = {
  id: string;
  title: string;
  totalVideoSec: number;
};

type Props = {
  items: Item[];
};

export default function InstructorHoursChart({ items }: Props) {
  const top = [...items]
    .sort((a, b) => b.totalVideoSec - a.totalVideoSec)
    .slice(0, 5)
    .map((x) => ({ ...x, hours: Math.round((x.totalVideoSec / 3600) * 10) / 10 }));

  const maxHours = Math.max(1, ...top.map((x) => x.hours));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-gray-900">Top Content Hours</h3>
      <p className="mt-1 text-xs text-gray-500">Your courses with the highest video duration.</p>

      {top.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">No course content yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {top.map((item) => {
            const width = Math.max(8, Math.round((item.hours / maxHours) * 100));
            return (
              <div key={item.id}>
                <p className="truncate text-xs font-semibold text-gray-700">{item.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
                  </div>
                  <span className="w-14 text-right text-xs text-gray-600">{item.hours} hrs</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
