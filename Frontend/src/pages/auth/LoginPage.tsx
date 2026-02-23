// src/pages/Login.tsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "@/assets/icon.svg";
import { useToast } from "@/components/toast";
import { loginApi } from "@/services/auth";

// ✅ add this
import { setUser } from "@/services/session";

const LoginPage = () => {
  const nav = useNavigate();
  const { showToast } = useToast();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true); // ✅ new
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => emailOrUsername.trim().length >= 3 && password.trim().length >= 4,
    [emailOrUsername, password]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      setError("Please enter valid login credentials.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await loginApi(
        emailOrUsername.trim().toLowerCase(),
        password,
        rememberMe
      );

      // ✅ stores role + isVerified + verificationStatus (after you add it in backend/types)
      setUser(data.user, rememberMe);

      showToast("Login successful", "success");

      setTimeout(() => {
        const isInstructor = data.user.role === "instructor";
        const isVerifiedInstructor =
          Boolean(data.user.isVerified) || data.user.verificationStatus === "Verified";

        if (data.user.role === "admin") return nav("/admin", { replace: true });

        if (isInstructor) {
          return nav(isVerifiedInstructor ? "/instructor/dashboard" : "/instructor/verify", {
            replace: true,
          });
        }

        nav("/courses", { replace: true });
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid place-items-center bg-[rgb(var(--bg))] px-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-base bg-surface shadow-sm">
        <div className="grid md:grid-cols-12">
          {/* Left panel */}
          <div className="hidden md:flex md:col-span-4 flex-col items-center justify-center gap-6 bg-gray-900 p-8 text-white">
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

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs font-medium text-muted">Email</label>
                <input
                  value={emailOrUsername}
                  onChange={(e) => {
                    setEmailOrUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  className="mt-2 w-full rounded-lg border border-base bg-[rgb(var(--bg))] px-3 py-2.5 text-sm text-basec focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-muted">Password</label>
                <div className="relative mt-2">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full rounded-lg border border-base bg-[rgb(var(--bg))] px-3 py-2.5 pr-14 text-sm text-basec focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                    autoComplete="current-password"
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

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-muted select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border border-base"
                  />
                  Remember me
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error (in-page) */}
              {error && <div className="text-[12px] text-red-500 transition">*{error}</div>}

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