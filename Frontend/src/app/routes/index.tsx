import { createBrowserRouter, redirect } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import { ensureSessionUser, getUser, isLoggedIn } from "@/services/session";
import AdminDashboardPage from "@/pages/admin/Dashboard";
import CourseApprovalsPage from "@/pages/admin/CourseApprovalsPage";
import ManageUsersPage from "@/pages/admin/ManageUserPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import VerifyInstructorsPage from "@/pages/admin/VerifyInstructorPage";
import LoginPage from "@/pages/auth/LoginPage";
import ProfilePage from "@/pages/auth/ProfilePage";
import RegisterPage from "@/pages/auth/RegisterPage";
import WalletPage from "@/pages/auth/WalletPage";
import CourseDetailsPage from "@/pages/courses/CourseDetailsPage";
import CourseLearnPage from "@/pages/courses/CourseLearnPage";
import CoursesPage from "@/pages/courses/CoursePage";
import InstructorDashboardPage from "@/pages/instructor/Dashboard";
import InstructorVerificationPage from "@/pages/instructor/InstructorVerificationPage";
import UploadCoursePage from "@/pages/instructor/UploadCoursePage";
import AboutPage from "@/pages/public/AboutPage";
import HomePage from "@/pages/public/HomePage";
import MentorsPage from "@/pages/public/MentorsDiscovryPage";
import PricingPage from "@/pages/public/PricingPage";
import AskQuestionPage from "@/pages/questions/AskQuestionPage";
import QuestionDetailsPage from "@/pages/questions/QuestionDetailsPage";
import QuestionsPage from "@/pages/questions/QuestionPage";

type UserRole = "student" | "instructor" | "admin";

const redirectIfLoggedIn = async () => {
  if (isLoggedIn()) return redirect("/courses");
  const user = await ensureSessionUser();
  if (user?.id) return redirect("/courses");
  return null;
};

const requireAuth = async () => {
  if (isLoggedIn()) return null;
  const user = await ensureSessionUser();
  if (!user?.id) return redirect("/login");
  return null;
};

const requireRole = async (...roles: UserRole[]) => {
  const user = getUser() || (await ensureSessionUser());
  if (!user) return redirect("/login");
  if (!roles.includes(user.role)) return redirect("/");
  return null;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage />, loader: redirectIfLoggedIn },
      { path: "register", element: <RegisterPage />, loader: redirectIfLoggedIn },
      { path: "instructor/verify", element: <InstructorVerificationPage />, loader: requireAuth },
    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage />, loader: redirectIfLoggedIn },
      { path: "courses", element: <CoursesPage /> },
      { path: "courses/:id", element: <CourseDetailsPage /> },
      { path: "courses/:id/learn", element: <CourseLearnPage />, loader: requireAuth },
      { path: "questions/ask", element: <AskQuestionPage />, loader: requireAuth },
      { path: "questions", element: <QuestionsPage /> },
      { path: "questions/:id", element: <QuestionDetailsPage /> },
      { path: "mentors", element: <MentorsPage />, loader: requireAuth },
      { path: "pricing", element: <PricingPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "profile", element: <ProfilePage />, loader: requireAuth },
      { path: "wallet", element: <WalletPage />, loader: requireAuth },
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
    ],
  },
]);
