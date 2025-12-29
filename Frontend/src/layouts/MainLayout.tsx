import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

// src/layouts/MainLayout.tsx
const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
