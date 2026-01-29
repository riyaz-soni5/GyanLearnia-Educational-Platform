import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/icon.svg";

type Role = "student" | "instructor" | "admin";

const roleLabel = (r: Role) =>
  r === "student" ? "Student" : r === "instructor" ? "Instructor" : "Admin";

const LoginPage = () => {
  const nav = useNavigate();

  const [role] = useState<Role>("student");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => emailOrUsername.trim().length >= 3 && password.trim().length >= 4,
    [emailOrUsername, password]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Please enter valid login credentials.");
      return;
    }

    setLoading(true);

    try {
      localStorage.setItem(
        "gyanlearnia_session",
        JSON.stringify({
          id: "u1",
          name: roleLabel(role),
          role,
          emailOrUsername,
        })
      );

      if (role === "admin") nav("/admin", { replace: true });
      else if (role === "instructor") nav("/instructor/upload-course", { replace: true });
      else nav("/dashboard", { replace: true });
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid place-items-center bg-[rgb(var(--bg))] px-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-base bg-surface shadow-sm">
        {/* Reduced left panel width using 12-col grid */}
        <div className="grid md:grid-cols-12">
          {/* Left panel: image + welcome back only */}
          <div className="hidden md:flex md:col-span-4 flex-col items-center justify-center gap-6 bg-gray-900 p-8 text-white">
            {/* Image */}
            <div className="bg-white p-2 rounded">
              <img
              src={Logo}
              alt="Welcome"
              className="w-full max-w-[220px] select-none"
              draggable={false}
              />
            </div>

          </div>

          {/* Right form */}
          <div className="md:col-span-8 p-8 sm:p-10">
            <h1 className="text-2xl font-bold text-basec">Sign in</h1>
            <h5 className="text-muted font-bold tracking-tight">Welcome back</h5>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs font-medium text-muted">Email or Username</label>
                <input
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-base bg-[rgb(var(--bg))] px-3 py-2.5 text-sm text-basec focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-muted">Password</label>
                <div className="relative mt-2">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-base bg-[rgb(var(--bg))] px-3 py-2.5 pr-14 text-sm text-basec focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted hover:text-basec"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                  !canSubmit || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <p className="text-center text-sm text-muted">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
