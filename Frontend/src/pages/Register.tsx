// src/pages/RegisterPage.tsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Role = "student" | "instructor";

const Icon = {
  User: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M4 20a8 8 0 0 1 16 0"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
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
};

const roleLabel = (r: Role) => (r === "student" ? "Student" : "Instructor");

const RegisterPage = () => {
  const nav = useNavigate();

  const [role, setRole] = useState<Role>("student");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Optional instructor details (collapsed UI to avoid overflow)
  const [showInstructorFields, setShowInstructorFields] = useState(false);
  const [expertise, setExpertise] = useState("");
  const [institution, setInstitution] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const baseValid =
      fullName.trim().length >= 3 &&
      email.includes("@") &&
      password.trim().length >= 6 &&
      confirmPassword.trim().length >= 6 &&
      password === confirmPassword;

    if (role === "instructor" && showInstructorFields) {
      return baseValid && expertise.trim().length >= 2;
    }

    return baseValid;
  }, [fullName, email, password, confirmPassword, role, showInstructorFields, expertise]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Please fill all required fields correctly.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Later: API call
      // await api.post("/auth/register", { fullName, email, password, role, expertise, institution });

      // ✅ Static demo session store
      localStorage.setItem(
        "gyanlearnia_session",
        JSON.stringify({
          id: "u_demo",
          name: fullName,
          role,
          email,
        })
      );

      // ✅ Redirect to login (or dashboard if you want)
      nav("/login", { replace: true });
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen grid place-items-center">
      <div className="w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left brand panel (same as login) */}
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
                Create your account and start learning.
              </p>
              <p className="text-sm text-gray-300">
                Join courses, ask questions, and connect with mentors across Nepal.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Ask academic questions anytime",
                  "Get verified mentor support",
                  "Learn skills and earn certificates",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />
                    <p className="text-sm text-gray-200">{t}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-300">
                  Tip: Instructor accounts can request verification later (admin approves).
                </p>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="p-8 sm:p-10">
            <h1 className="text-2xl font-bold text-gray-900">Register</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create your account to get started.
            </p>

            {/* Role selector (matches login style buttons) */}
            <div className="mt-6">
              <p className="text-xs font-medium text-gray-700">Register as</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["student", "instructor"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      if (r === "student") setShowInstructorFields(false);
                    }}
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-semibold border transition",
                      role === r
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {roleLabel(r)}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Full name */}
              <div>
                <label className="text-xs font-medium text-gray-700">Full Name</label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icon.User className="h-4 w-4" />
                  </span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-gray-700">Email</label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icon.Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-xs font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Instructor extra fields (collapsed to prevent overflow) */}
              {role === "instructor" ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Instructor details (optional now)
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        Add later; verification can be requested after signup.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowInstructorFields((v) => !v)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {showInstructorFields ? "Hide" : "Add"}
                    </button>
                  </div>

                  {showInstructorFields ? (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Expertise (e.g., Physics, MERN)
                        </label>
                        <input
                          value={expertise}
                          onChange={(e) => setExpertise(e.target.value)}
                          placeholder="Your main subject/skill"
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Institution (optional)
                        </label>
                        <input
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="School/College name"
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Error */}
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

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
                {loading ? "Creating account..." : "Create account"}
              </button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  Login
                </Link>
              </p>

              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4">
                <p className="text-xs font-medium text-gray-700">Demo</p>
                <p className="mt-1 text-xs text-gray-600">
                  Static UI for now — backend registration will be connected later.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
