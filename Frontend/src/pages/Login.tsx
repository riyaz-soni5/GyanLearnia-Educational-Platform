// src/pages/LoginPage.tsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";


type Role = "student" | "instructor" | "admin";

const Icon = {
  Eye: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        className="stroke-current"
        strokeWidth="1.8"
      />
    </svg>
  ),
  EyeOff: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 4l16 16"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 6.8C4 8.6 2 12 2 12s3.5 7 10 7c2.1 0 3.9-.6 5.3-1.4"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.1 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7s-1.1 2.2-3.2 4"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Lock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6 11h12v10H6V11z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Mail: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 6h16v12H4V6z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 7l8 6 8-6"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const roleLabel = (r: Role) =>
  r === "student" ? "Student" : r === "instructor" ? "Instructor" : "Admin";

const LoginPage = () => {
  const nav = useNavigate();

  const [role, setRole] = useState<Role>("student");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return emailOrUsername.trim().length >= 3 && password.trim().length >= 4;
  }, [emailOrUsername, password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Please enter your email/username and password.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Later: call backend API
      // await api.post("/auth/login", { emailOrUsername, password, role });

      // ✅ For now (static): store session-like info
      localStorage.setItem(
        "gyanlearnia_session",
        JSON.stringify({
          id: "u1",
          name: roleLabel(role),
          role,
          emailOrUsername,
        })
      );

      // Optional fakeAuth:
      // loginAs(role);

      // ✅ Redirect based on role
      if (role === "admin") nav("/admin", { replace: true });
      else if (role === "instructor") nav("/instructor/upload-course", { replace: true });
      else nav("/dashboard", { replace: true });
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen grid place-items-center">
      <div className="w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left brand panel */}
          <div className="hidden md:block bg-gray-900 text-white p-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 grid place-items-center">
                <span className="text-sm font-bold">GL</span>
              </div>
              <div>
                <p className="text-lg font-semibold">GyanLearnia</p>
                <p className="text-xs text-gray-300">Learn smarter, Nepal-focused.</p>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <p className="text-2xl font-bold leading-tight">
                Sign in to continue learning and mentoring.
              </p>
              <p className="text-sm text-gray-300">
                Access courses, ask questions, and connect with mentors.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Curriculum-aligned learning",
                  "Verified answers & mentor support",
                  "Skill-based courses & certification",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />
                    <p className="text-sm text-gray-200">{t}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-300">
                  Tip: For demo, choose a role and login with any credentials (static).
                </p>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="p-8 sm:p-10">
            <h1 className="text-2xl font-bold text-gray-900">Login</h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back. Please sign in to your account.
            </p>


            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Email/Username */}
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Email / Username
                </label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icon.Mail className="h-4 w-4" />
                  </span>
                  <input
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="e.g., salomi_k or salomi@email.com"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-gray-700">Password</label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icon.Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <Icon.EyeOff className="h-4 w-4" /> : <Icon.Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
                  onClick={() => alert("Static UI: Add forgot password flow later")}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className={[
                  "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                  !canSubmit || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700",
                ].join(" ")}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="font-semibold text-indigo-700 hover:text-indigo-800">
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
