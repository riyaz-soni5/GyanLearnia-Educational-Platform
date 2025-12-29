import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import AuthLayout from "../../layouts/AuthLayout";

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


export const router = createBrowserRouter([

  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "courses", element: <CoursesPage /> },
      { path: "questions", element: <QuestionsPage /> },
      { path: "mentors", element: <MentorsPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "questions/:id", element: <QuestionDetailsPage /> },
      { path: "courses/:id", element: <CourseDetailsPage /> }

      
    ],
  },
]);
