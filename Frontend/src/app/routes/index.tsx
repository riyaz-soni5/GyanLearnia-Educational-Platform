import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import AuthLayout from "../../layouts/AuthLayout";
import AdminLayout from "../../layouts/AdminLayout";

// Pages
import HomePage from "../../pages/HomePage";
import CoursesPage from "../../pages/CoursePage";
import QuestionsPage from "../../pages/QuestionPage";
import MentorsPage from "../../pages/MentorsDiscovryPage";
import LoginPage from "../../pages/Login";
import RegisterPage from "../../pages/Register";
import PricingPage from "../../pages/PricingPage";
import AboutPage from "../../pages/AboutPage";
import QuestionDetailsPage from "../../pages/QuestionDetailsPage";
import CourseDetailsPage from "../../pages/CourseDetailsPage";
import UploadCoursePage from "../../pages/instructor/UploadCoursePage";
import InstructorDashboardPage from "../../pages/instructor/Dashboard";
import AdminDashboardPage from "../../pages/admin/Dashboard";
import VerifyInstructorsPage from "../../pages/admin/VerifyInstructorPage";
import CourseApprovalsPage from "../../pages/admin/CourseApprovalsPage";
import ManageUsersPage from "../../pages/admin/ManageUserPage";
import ReportsPage from "../../pages/admin/ReportsPage";
import SettingsPage from "../../pages/admin/SettingsPage";
import AskQuestionPage from "../../pages/AskQuestionPage";

export const router = createBrowserRouter([
  // Auth pages (no header/footer)
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },

  // Main public pages (with header/footer)
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "courses", element: <CoursesPage /> },
      { path: "courses/:id", element: <CourseDetailsPage /> },

      {path: "/question/ask", element: <AskQuestionPage />},
      { path: "questions", element: <QuestionsPage /> },
      { path: "questions/:id", element: <QuestionDetailsPage /> },

      { path: "mentors", element: <MentorsPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "about", element: <AboutPage /> },

      { path: "instructor/upload-course", element: <UploadCoursePage /> },
      { path: "instructor/dashboard", element: <InstructorDashboardPage /> },
    ],
  },

  // Admin area (different layout)
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [{ index: true, element: <AdminDashboardPage />, },
      { path: "verify-instructors", element: <VerifyInstructorsPage /> },
      { path: "course-approvals", element: <CourseApprovalsPage /> },
      { path: "users", element: <ManageUsersPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> }

    ],
  },
]);
