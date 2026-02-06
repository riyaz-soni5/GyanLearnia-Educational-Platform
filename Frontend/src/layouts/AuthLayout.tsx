// src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen w-screen bg-gray-50">
      <main className="flex min-h-screen w-screen items-center justify-center">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
