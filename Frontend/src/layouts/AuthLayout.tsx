// src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* No Header */}
      <main className="flex min-h-screen items-center justify-center px-4">
        <Outlet />
      </main>
      {/* No Footer */}
    </div>
  );
};

export default AuthLayout;
