import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/icon.svg";

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
  Chevron: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 8l4 4 4-4"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const roleLabel = (r: Role) => (r === "student" ? "Student" : "Instructor");

const inputBase =
  "w-full rounded-lg border border-base bg-[rgb(var(--bg))] px-3 py-2.5 text-sm text-basec " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
  "focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900";

const RegisterPage = () => {
  const nav = useNavigate();

  const [role, setRole] = useState<Role>("student");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

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
  }, [
    fullName,
    email,
    password,
    confirmPassword,
    role,
    showInstructorFields,
    expertise,
  ]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Please check the fields — passwords must match and be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      localStorage.setItem(
        "gyanlearnia_session",
        JSON.stringify({
          id: "u_demo",
          name: fullName,
          role,
          email,
        })
      );

      nav("/login", { replace: true });
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid place-items-center bg-[rgb(var(--bg))] px-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-base bg-surface shadow-sm">
        <div className="grid md:grid-cols-12">
          {/* Left panel: logo only (same as login) */}
          <div className="hidden md:flex md:col-span-4 flex-col items-center justify-center bg-gray-900 p-8 text-white">
            <div className="bg-white p-2 rounded">
              <img
                src={Logo}
                alt="GyanLearnia"
                className="w-full max-w-[220px] select-none"
                draggable={false}
              />
            </div>
          </div>

          {/* Right panel */}
          <div className="md:col-span-8 p-8 sm:p-10">
            <h1 className="text-2xl font-bold text-basec">Create account</h1>
            <h5 className="text-muted tracking-tight">
              Join GyanLearnia now!
            </h5>

            {/* Role segmented control */}
            <div className="mt-2">
              <p className="text-xs font-medium text-muted">Register as</p>

              <div className="mt-2 inline-flex rounded-xl border border-base bg-[rgb(var(--bg))] p-1">
                {(["student", "instructor"] as Role[]).map((r) => {
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        if (r === "student") setShowInstructorFields(false);
                      }}
                      className={[
                        "rounded-lg px-3 py-2 text-sm font-semibold transition",
                        active
                          ? "bg-surface text-basec shadow-sm"
                          : "text-muted hover:text-basec",
                      ].join(" ")}
                    >
                      {roleLabel(r)}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-2 space-y-4">
              {/* Full name */}
              <div>
                <label className="text-xs font-medium text-muted">Full name</label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <Icon.User className="h-4 w-4" />
                  </span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className={`${inputBase} pl-10`}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-muted">Email</label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <Icon.Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`${inputBase} pl-10`}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-muted">Password</label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <Icon.Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`${inputBase} pl-10 pr-14`}
                    autoComplete="new-password"
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

              {/* Confirm password */}
              <div>
                <label className="text-xs font-medium text-muted">Confirm password</label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <Icon.Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPw2 ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`${inputBase} pl-10 pr-14`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw2((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted hover:text-basec"
                  >
                    {showPw2 ? "Hide" : "Show"}
                  </button>
                </div>

                {confirmPassword.length > 0 && password.length > 0 && password !== confirmPassword ? (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Passwords don’t match.
                  </p>
                ) : null}
              </div>

              {/* Instructor accordion */}
              {role === "instructor" ? (
                <div className="rounded-xl border border-base bg-[rgb(var(--bg))]">
                  <button
                    type="button"
                    onClick={() => setShowInstructorFields((v) => !v)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-basec">
                        Instructor details
                        <span className="ml-2 text-xs font-medium text-muted">(optional)</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Add now or later — this helps students discover you.
                      </p>
                    </div>

                    <span
                      className={[
                        "text-muted transition",
                        showInstructorFields ? "rotate-180" : "rotate-0",
                      ].join(" ")}
                    >
                      <Icon.Chevron className="h-5 w-5" />
                    </span>
                  </button>

                  {showInstructorFields ? (
                    <div className="px-4 pb-4 space-y-4">
                      <div>
                        <label className="text-xs font-medium text-muted">Expertise</label>
                        <input
                          value={expertise}
                          onChange={(e) => setExpertise(e.target.value)}
                          placeholder="e.g., Physics, MERN, Accounting"
                          className={`${inputBase} mt-2`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted">
                          Institution (optional)
                        </label>
                        <input
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="School/College name"
                          className={`${inputBase} mt-2`}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

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
                {loading ? "Creating account..." : "Create account"}
              </button>

              <p className="text-center text-sm text-muted">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
