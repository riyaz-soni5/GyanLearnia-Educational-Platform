// src/routes/index.tsx
import { createBrowserRouter, redirect } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import AdminLayout from "@/layouts/AdminLayout";

// ✅ add these
import { getUser, isLoggedIn } from "@/services/session";

// Pages
import HomePage from "@/pages/public/HomePage";
import CoursesPage from "@/pages/courses/CoursePage";
import QuestionsPage from "@/pages/questions/QuestionPage";
import MentorsPage from "@/pages/public/MentorsDiscovryPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ProfilePage from "@/pages/auth/ProfilePage";
import PricingPage from "@/pages/public/PricingPage";
import AboutPage from "@/pages/public/AboutPage";
import QuestionDetailsPage from "@/pages/questions/QuestionDetailsPage";
import CourseDetailsPage from "@/pages/courses/CourseDetailsPage";
import UploadCoursePage from "@/pages/instructor/UploadCoursePage";
import InstructorDashboardPage from "@/pages/instructor/Dashboard";
import AdminDashboardPage from "@/pages/admin/Dashboard";
import VerifyInstructorsPage from "@/pages/admin/VerifyInstructorPage";
import CourseApprovalsPage from "@/pages/admin/CourseApprovalsPage";
import ManageUsersPage from "@/pages/admin/ManageUserPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import AskQuestionPage from "@/pages/questions/AskQuestionPage";
import InstructorVerificationPage from "@/pages/instructor/InstructorVerificationPage";

// ✅ helpers (loaders)
const redirectIfLoggedIn = () => {
  if (isLoggedIn()) return redirect("/courses");
  return null;
};

const requireAuth = () => {
  if (!isLoggedIn()) return redirect("/login");
  return null;
};

const requireRole = (...roles: Array<"student" | "instructor" | "admin">) => {
  const u = getUser();
  if (!u) return redirect("/login");
  if (!roles.includes(u.role)) return redirect("/"); // or redirect("/courses")
  return null;
};

export const router = createBrowserRouter([
  // Auth pages (no header/footer)
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage />, loader: redirectIfLoggedIn },
      { path: "register", element: <RegisterPage />, loader: redirectIfLoggedIn },
      { path: "instructor/verify", element: <InstructorVerificationPage />, loader: requireAuth },
    ],
  },

  // Main public pages (with header/footer)
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // ✅ Key change: conditional landing
      { index: true, element: <HomePage />, loader: redirectIfLoggedIn },

      { path: "courses", element: <CoursesPage /> },
      { path: "courses/:id", element: <CourseDetailsPage /> },

      // ✅ protect ask page (common)
      { path: "questions/ask", element: <AskQuestionPage />, loader: requireAuth },

      { path: "questions", element: <QuestionsPage /> },
      { path: "questions/:id", element: <QuestionDetailsPage /> },

      { path: "mentors", element: <MentorsPage />, loader: requireAuth },
      { path: "pricing", element: <PricingPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "profile", element: <ProfilePage />, loader: requireAuth },

      // ✅ instructor protected
      {
        path: "instructor/upload-course",
        element: <UploadCoursePage />,
        loader: () => requireRole("instructor"),
      },
      {
        path: "instructor/dashboard",
        element: <InstructorDashboardPage />,
        loader: () => requireRole("instructor"),
      },
    ],
  },

  // Admin area (different layout) ✅ protect admin group
  {
    path: "/admin",
    element: <AdminLayout />,
    loader: () => requireRole("admin"),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "verify-instructors", element: <VerifyInstructorsPage /> },
      { path: "course-approvals", element: <CourseApprovalsPage /> },
      { path: "users", element: <ManageUsersPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
