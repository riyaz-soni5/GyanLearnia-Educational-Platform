import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/icon.svg";
import { useToast } from "../components/toast";

type Role = "student" | "instructor";
const roleLabel = (r: Role) => (r === "student" ? "Student" : "Instructor");

const inputBase =
  "w-full rounded-lg border border-base bg-[rgb(var(--bg))] px-3 py-2.5 text-sm text-basec " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
  "focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900";

const RegisterPage = () => {
  const nav = useNavigate();
  const { showToast } = useToast();

  const [role, setRole] = useState<Role>("student");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [expertise, setExpertise] = useState("");
  const [institution, setInstitution] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordTooShort = password.length > 0 && password.trim().length < 6;

  const passwordsMismatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  const canSubmit = useMemo(() => {
    const baseValid =
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      email.includes("@") &&
      password.trim().length >= 6 &&
      confirmPassword.trim().length >= 6 &&
      !passwordsMismatch;

    if (role === "instructor") {
      return baseValid && expertise.trim().length >= 2;
    }

    return baseValid;
  }, [
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    role,
    expertise,
    passwordsMismatch,
  ]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // One place for all validation errors
    if (passwordTooShort) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (passwordsMismatch) {
      setError("Passwords don’t match.");
      return;
    }

    if (!canSubmit) {
      setError("Please fill all required fields.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        expertise: role === "instructor" ? expertise.trim() : undefined,
        institution: role === "instructor" ? institution.trim() : undefined,
      };

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Registration failed");

      showToast("Account created successfully", "success");
      setTimeout(() => nav("/login", { replace: true }), 1200);
    } catch (err: any) {
      setError(err.message || "Registration failed");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[rgb(var(--bg))] px-4">
      <div className="min-h-screen flex items-start md:items-center justify-center py-10 transition">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-base bg-surface shadow-sm">
          <div className="grid md:grid-cols-12">
            {/* Left panel */}
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
                          setError(null);
                          if (r === "student") {
                            setExpertise("");
                            setInstitution("");
                          }
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
                {/* First + Last name */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted">First name</label>
                    <div className="mt-2 relative">
                      <input
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="First name"
                        className={inputBase}
                        autoComplete="given-name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted">Last name</label>
                    <div className="mt-2 relative">
                      <input
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Last name"
                        className={inputBase}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-medium text-muted">Email</label>
                  <div className="mt-2 relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="you@example.com"
                      className={inputBase}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-medium text-muted">Password</label>
                  <div className="relative mt-2">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPassword(v);

                        if (v.length > 0 && v.trim().length < 6) {
                          setError("Password must be at least 6 characters.");
                        } else if (confirmPassword.length > 0 && v !== confirmPassword) {
                          setError("Passwords don’t match.");
                        } else if (
                          error === "Password must be at least 6 characters." ||
                          error === "Passwords don’t match."
                        ) {
                          setError(null);
                        }
                      }}
                      placeholder="At least 6 characters"
                      className={inputBase}
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
                    <input
                      type={showPw2 ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        const v = e.target.value;
                        setConfirmPassword(v);

                        if (password.length > 0 && password.trim().length < 6) {
                          setError("Password must be at least 6 characters.");
                        } else if (password.length > 0 && v.length > 0 && v !== password) {
                          setError("Passwords don’t match.");
                        } else if (error === "Passwords don’t match.") {
                          setError(null);
                        }
                      }}
                      placeholder="Re-enter password"
                      className={inputBase}
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
                </div>

                {/* Instructor fields (animated expand/collapse) */}
                <div
                  className={[
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    role === "instructor" ? "max-h-40 opacity-100 mt-0" : "max-h-0 opacity-0 mt-0",
                  ].join(" ")}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                    <div>
                      <label className="text-xs font-medium text-muted">Expertise</label>
                      <input
                        value={expertise}
                        onChange={(e) => {
                          setExpertise(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Science, Maths, Computer"
                        className={`${inputBase} mt-2`}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted">Institution</label>
                      <input
                        value={institution}
                        onChange={(e) => {
                          setInstitution(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="School/College name"
                        className={`${inputBase} mt-2`}
                      />
                    </div>
                  </div>
                </div>

                {/* ONE fixed error placeholder (never changes height) */}
                <div
                  className={[
                    "text-[12px] text-red-500 transition",
                    error ? "text-red-500" : "text-transparent",
                  ].join(" ")}
                  aria-live="polite"
                >
                  *{error ?? "\u00A0"}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                    loading
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
    </div>
  );
};

export default RegisterPage;