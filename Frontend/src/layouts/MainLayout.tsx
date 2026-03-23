import { useEffect } from "react";
import { Outlet, useLocation, matchPath } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MainLayout = () => {
  const location = useLocation();
  const isCourseLearnPage = Boolean(matchPath("/courses/:id/learn", location.pathname));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      {!isCourseLearnPage ? <Header /> : null}

      <main className={isCourseLearnPage ? "flex-1" : "flex-1 px-4 py-6 sm:px-6 lg:px-8"}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
