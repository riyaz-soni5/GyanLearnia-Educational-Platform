import { FiAlertCircle, FiClock, FiXCircle } from "react-icons/fi";
import type { MyInstructorCourse } from "../../services/instructorCourse";

type Props = {
  course: MyInstructorCourse;
  onEdit?: (courseId: string) => void;
};

const badgeByStatus = (status: MyInstructorCourse["status"]) => {
  if (status === "Pending") {
    return {
      cls: "bg-yellow-50 text-yellow-700 ring-yellow-200",
      icon: <FiClock className="h-4 w-4" />,
      title: "Under admin review",
      desc: "Your course is submitted and waiting for admin approval.",
    };
  }

  if (status === "Rejected") {
    return {
      cls: "bg-red-50 text-red-700 ring-red-200",
      icon: <FiXCircle className="h-4 w-4" />,
      title: "Needs changes",
      desc: "Update the course and publish again.",
    };
  }

  return {
    cls: "bg-gray-50 text-gray-700 ring-gray-200",
    icon: <FiAlertCircle className="h-4 w-4" />,
    title: "Draft",
    desc: "This course is still in draft mode.",
  };
};

export default function CourseSubmissionStatusCard({ course, onEdit }: Props) {
  const meta = badgeByStatus(course.status);

  if (course.status === "Published") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">Submission Status</h3>
      <p className="mt-1 text-sm text-gray-600">Latest non-published course</p>

      <div className={`mt-4 rounded-xl p-4 ring-1 ${meta.cls}`}>
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          {meta.icon}
          {meta.title}
        </p>
        <p className="mt-1 text-xs">{meta.desc}</p>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 p-4">
        <p className="text-xs text-gray-500">Course</p>
        <p className="mt-1 text-sm font-semibold text-gray-900">{course.title}</p>
        <p className="mt-1 text-xs text-gray-600">
          Submitted: {new Date(course.createdAt).toLocaleDateString()}
        </p>

        {course.rejectionReason ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-red-700">
              <FiAlertCircle className="h-4 w-4" />
              Rejection Reason
            </p>
            <p className="mt-1 text-xs text-red-700">{course.rejectionReason}</p>
          </div>
        ) : null}
      </div>

      {course.status === "Rejected" ? (
        <button
          type="button"
          onClick={() => onEdit?.(course.id)}
          className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Edit and Resubmit
        </button>
      ) : null}
    </div>
  );
}
