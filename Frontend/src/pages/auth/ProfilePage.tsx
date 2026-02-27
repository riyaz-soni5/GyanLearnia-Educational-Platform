import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/toast";
import {
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  type UserProfile,
} from "@/services/userProfile";
import { listMyCourses } from "@/services/instructorCourse";
import { getUser, setUser } from "@/services/session";
import ConfirmDialog from "@/components/ConfirmDialog";

const inputBase =
  "w-full rounded-lg border border-base bg-[rgb(var(--bg))] px-3 py-2.5 text-sm text-basec " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
  "focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900";

const genderValues = ["", "male", "female", "other", "prefer_not_to_say"] as const;
type GenderValue = (typeof genderValues)[number];
const toGenderValue = (value: string): GenderValue =>
  genderValues.includes(value as GenderValue) ? (value as GenderValue) : "";
const sanitizeInterests = (values: string[] | undefined): string[] => {
  if (!Array.isArray(values)) return [];
  const unique = new Map<string, string>();
  values.forEach((value) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return;
    const key = trimmed.toLocaleLowerCase();
    if (!unique.has(key)) unique.set(key, trimmed);
  });
  return Array.from(unique.values());
};

const ProfilePage = () => {
  const nav = useNavigate();
  const { showToast } = useToast();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const resolveAssetUrl = useCallback((url?: string | null) => {
    if (!url) return null;
    const trimmed = String(url).trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `${API_BASE}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }, [API_BASE]);

  const initialUser = getUser();

  const [profile, setProfile] = useState<UserProfile | null>(
    initialUser
      ? {
          id: initialUser.id,
          firstName: initialUser.firstName || "",
          lastName: initialUser.lastName || "",
          email: initialUser.email,
          role: initialUser.role,
          avatarUrl: initialUser.avatarUrl ?? null,
        }
      : null
  );

  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    profile?.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : ""
  );
  const [gender, setGender] = useState<GenderValue>(toGenderValue(profile?.gender ?? ""));
  const [expertise, setExpertise] = useState(profile?.expertise ?? "");
  const [institution, setInstitution] = useState(profile?.institution ?? "");

  const [bio, setBio] = useState(profile?.bio ?? "");
  const [interests, setInterests] = useState<string[]>(sanitizeInterests(profile?.interests));
  const [interestInput, setInterestInput] = useState("");
  const [academicBackgrounds, setAcademicBackgrounds] = useState<
    Array<{ id: string; institution: string; startDate: string; endDate: string; isCurrent: boolean }>
  >([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatarUrl ?? null);

  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructorCourses, setInstructorCourses] = useState<
    Array<{ status: "Draft" | "Pending" | "Published" | "Rejected" }>
  >([]);

  const isInstructor = profile?.role === "instructor";
  // Role-based overview switch:
  // verified instructor sees instructor metrics; student + unverified instructor see learner stats.
  const isVerifiedInstructor =
    profile?.role === "instructor" && profile?.verificationStatus === "Verified";

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchCurrentUserProfile();
        if (!mounted) return;

        setProfile(data);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setEmail(data.email ?? "");
        setDateOfBirth(data.dateOfBirth ? String(data.dateOfBirth).slice(0, 10) : "");
        setGender(toGenderValue(data.gender ?? ""));
        setExpertise(data.expertise ?? "");
        setInstitution(data.institution ?? "");
        setBio(data.bio ?? "");
        setInterests(sanitizeInterests(data.interests));
        setInterestInput("");
        setAvatarPreview(resolveAssetUrl(data.avatarUrl ?? null));

        setAcademicBackgrounds(
          Array.isArray(data.academicBackgrounds)
            ? data.academicBackgrounds.map((item, idx) => ({
                id: `${idx}-${String(item.institution || "")}`,
                institution: item.institution || "",
                startDate: item.startDate ? String(item.startDate).slice(0, 10) : "",
                endDate: item.endDate ? String(item.endDate).slice(0, 10) : "",
                isCurrent: Boolean(item.isCurrent),
              }))
            : []
        );

      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Failed to load profile";
        showToast(message, "error");
        if (message === "Unauthorized") {
          nav("/login", { replace: true });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [nav, showToast, resolveAssetUrl]);

  useEffect(() => {
    let mounted = true;

    // Reuse the same data source as Instructor Dashboard (/api/instructor/courses/mine).
    if (!isVerifiedInstructor) {
      setInstructorCourses([]);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const res = await listMyCourses();
        if (!mounted) return;
        setInstructorCourses(Array.isArray(res.items) ? res.items : []);
      } catch {
        if (!mounted) return;
        setInstructorCourses([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isVerifiedInstructor]);

  const canSubmit = useMemo(() => {
    const validNames =
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      email.trim().length >= 5 &&
      email.includes("@");

    if (!isInstructor) return validNames;
    return validNames;
  }, [firstName, lastName, email, isInstructor]);
  const showAcademicSection = isEditing || academicBackgrounds.length > 0;
  const instructorMetrics = useMemo(() => {
    const totalCourses = instructorCourses.length;
    const publishedCourses = instructorCourses.filter((c) => c.status === "Published").length;
    const pendingCourses = instructorCourses.filter((c) => c.status === "Pending").length;
    return { totalCourses, publishedCourses, pendingCourses };
  }, [instructorCourses]);

  const formatShortDate = (value?: string | null) => {
    if (!value) return "Not set";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not set";
    return parsed.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAcademicRange = (item: {
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  }) => {
    const start = formatShortDate(item.startDate);
    if (item.isCurrent) return `${start} - Present`;
    const end = formatShortDate(item.endDate);
    return `${start} - ${end}`;
  };

  const addInterest = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const key = trimmed.toLocaleLowerCase();
    const alreadyExists = interests.some((item) => item.toLocaleLowerCase() === key);
    if (alreadyExists) {
      showToast("Interest already added", "error");
      return;
    }

    setInterests((prev) => [...prev, trimmed]);
    setInterestInput("");
  };

  const removeInterest = (value: string) => {
    setInterests((prev) => prev.filter((item) => item !== value));
  };

  const onInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest(interestInput);
      return;
    }

    if (e.key === "Backspace" && !interestInput && interests.length > 0) {
      setInterests((prev) => prev.slice(0, prev.length - 1));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit || !profile) return;
    setConfirmOpen(true);
  };

  const displayRole = profile?.role === "admin"
    ? "Admin"
    : profile?.role === "instructor"
    ? "Instructor"
    : "Student";

  const resetToProfile = () => {
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    setEmail(profile.email ?? "");
    setDateOfBirth(profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "");
    setGender(toGenderValue(profile.gender ?? ""));
    setExpertise(profile.expertise ?? "");
    setInstitution(profile.institution ?? "");
    setBio(profile.bio ?? "");
    setInterests(sanitizeInterests(profile.interests));
    setInterestInput("");
    setAcademicBackgrounds(
      Array.isArray(profile.academicBackgrounds)
        ? profile.academicBackgrounds.map((item, idx) => ({
            id: `${idx}-${String(item.institution || "")}`,
            institution: item.institution || "",
            startDate: item.startDate ? String(item.startDate).slice(0, 10) : "",
            endDate: item.endDate ? String(item.endDate).slice(0, 10) : "",
            isCurrent: Boolean(item.isCurrent),
          }))
        : []
    );
    setAvatarFile(null);
    setAvatarPreview(resolveAssetUrl(profile.avatarUrl ?? null));
    setError(null);
  };

  const doSaveProfile = async () => {
    if (!canSubmit || !profile) return;
    setConfirmLoading(true);
    setSaving(true);
    setError(null);

    try {
      let uploadedAvatarUrl: string | null | undefined =
        avatarPreview === null ? null : profile.avatarUrl ?? null;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("image", avatarFile);

        const res = await fetch(`${API_BASE}/api/images`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await res.json()
          : null;

        if (!res.ok) {
          const fallbackText = data ? "" : await res.text();
          throw new Error(
            data?.message ||
              data?.error ||
              fallbackText?.slice(0, 200) ||
              "Failed to upload avatar"
          );
        }
        uploadedAvatarUrl =
          (typeof data?.url === "string" && data.url.trim()) ||
          (typeof data?.imageUrl === "string" && data.imageUrl.trim()) ||
          uploadedAvatarUrl;
      }

      const updated = await updateCurrentUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        bio: bio.trim() || undefined,
        interests: sanitizeInterests(interests),
        academicBackgrounds: academicBackgrounds.map((item) => ({
          institution: item.institution.trim(),
          startDate: item.startDate,
          endDate: item.isCurrent ? null : item.endDate || null,
          isCurrent: item.isCurrent,
        })),
        avatarUrl: uploadedAvatarUrl ?? null,
        expertise: isInstructor ? expertise.trim() || undefined : undefined,
        institution: isInstructor ? institution.trim() || undefined : undefined,
      });

      setProfile(updated);
      setInterests(sanitizeInterests(updated.interests));
      setInterestInput("");

      const storedInLocal = Boolean(localStorage.getItem("gyanlearnia_user"));

      setUser(
        {
          id: updated.id,
          role: updated.role,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          avatarUrl: updated.avatarUrl ?? uploadedAvatarUrl ?? null,
          isVerified: updated.isVerified,
          verificationStatus: updated.verificationStatus,
        },
        storedInLocal
      );

      showToast("Profile updated successfully", "success");
      setAvatarFile(null);
      setAvatarPreview(resolveAssetUrl(updated.avatarUrl ?? uploadedAvatarUrl ?? null));
      setIsEditing(false);
      setConfirmOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
    } finally {
      setSaving(false);
      setConfirmLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <section className="rounded-2xl bg-surface px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-basec">Profile Settings</h1>
          </div>
          {profile ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-muted ring-1 ring-base">
                {displayRole}
              </span>
              {profile.role === "instructor" && (
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                  {profile.verificationStatus === "Verified"
                    ? "Verified Instructor"
                    : "Instructor"}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!isEditing) {
                    resetToProfile();
                  }
                  setIsEditing((v) => !v);
                }}
                className="ml-auto inline-flex items-center justify-center rounded-lg border border-base px-3 py-1.5 text-xs font-semibold text-basec hover:bg-[rgb(var(--bg))]"
              >
                {isEditing ? "Cancel editing" : "Edit profile"}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl bg-surface px-6 py-6 shadow-sm sm:px-8 sm:py-7">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="flex flex-col items-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile avatar"
                  className="h-44 w-44 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center rounded-full bg-indigo-600 text-4xl font-semibold text-white">
                  {profile
                    ? (profile.firstName?.[0] ?? profile.email?.[0] ?? "U").toUpperCase()
                    : "U"}
                </div>
              )}


              {isEditing && (
                <div className="mt-3 flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-base px-3 py-2 text-xs font-semibold text-basec hover:bg-[rgb(var(--bg))]">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setAvatarFile(file);
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setAvatarPreview(url);
                        }
                      }}
                      disabled={loading || saving}
                    />
                    Change picture
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:text-red-600"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4 w-full max-w-[220px]">
                <p className="text-center text-[11px] font-medium uppercase tracking-wide text-muted">
                  Interests
                </p>
                {interests.length > 0 ? (
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-center text-xs text-muted">No interests added</p>
                )}
              </div>

            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted">First name</label>
                  <input
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="First name"
                    className={`${inputBase} mt-2`}
                    autoComplete="given-name"
                    disabled={loading || saving || !isEditing}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted">Last name</label>
                  <input
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Last name"
                    className={`${inputBase} mt-2`}
                    autoComplete="family-name"
                    disabled={loading || saving || !isEditing}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted">DOB</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className={`${inputBase} mt-2`}
                      disabled={loading || saving}
                    />
                  ) : (
                    <div className={`${inputBase} mt-2 bg-[rgb(var(--bg))]`}>
                      {formatShortDate(dateOfBirth)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted">Gender</label>
                  {isEditing ? (
                    <select
                      value={gender}
                      onChange={(e) => setGender(toGenderValue(e.target.value))}
                      className={`${inputBase} mt-2`}
                      disabled={loading || saving}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  ) : (
                    <div className={`${inputBase} mt-2 bg-[rgb(var(--bg))]`}>
                      {gender === "male"
                        ? "Male"
                        : gender === "female"
                        ? "Female"
                        : gender === "other"
                        ? "Other"
                        : gender === "prefer_not_to_say"
                        ? "Prefer not to say"
                        : "Not set"}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted">Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className={`${inputBase} mt-2 bg-gray-50 dark:bg-gray-800 cursor-not-allowed`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted">Short bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell learners about yourself in 2–3 sentences."
                  rows={6}
                  className={`${inputBase} mt-2 resize-none`}
                  disabled={loading || saving || !isEditing}
                />
              </div>

              {isEditing && (
                <div>
                  <label className="text-xs font-medium text-muted">Interests</label>

                  <div className="mt-2 rounded-lg border border-base px-3 py-2 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus:ring-indigo-900">
                    <div className="flex flex-wrap items-center gap-2">
                      {interests.map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => removeInterest(interest)}
                            className="text-indigo-500 hover:text-red-600"
                            disabled={loading || saving}
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <input
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        onKeyDown={onInterestKeyDown}
                        placeholder="Add Your Interest"
                        className="min-w-[160px] flex-1 border-none bg-transparent text-sm text-basec focus:outline-none"
                        disabled={loading || saving}
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          {isInstructor && (
            <div className="grid gap-4 sm:grid-cols-2">
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
                  disabled={loading || saving || !isEditing}
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
                  disabled={loading || saving || !isEditing}
                />
              </div>
            </div>
          )}

          {showAcademicSection && (
            <div>
              <label className="text-xs font-medium text-muted">Academic background</label>
              <div className="mt-2 space-y-3">
                {academicBackgrounds.map((item, idx) => (
                  isEditing ? (
                    <div
                      key={item.id}
                      className="rounded-xl border border-base bg-[rgb(var(--bg))] p-3 space-y-2"
                    >
                      <div>
                        <input
                          type="text"
                          placeholder="Institution name"
                          value={item.institution}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAcademicBackgrounds((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, institution: v } : row
                              )
                            );
                          }}
                          className={inputBase}
                          disabled={loading || saving}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] text-muted">Start date</label>
                          <input
                            type="date"
                            value={item.startDate}
                            onChange={(e) => {
                              const v = e.target.value;
                              setAcademicBackgrounds((prev) =>
                                prev.map((row, i) =>
                                  i === idx ? { ...row, startDate: v } : row
                                )
                              );
                            }}
                            className={`${inputBase} mt-1`}
                            disabled={loading || saving}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted">End date</label>
                          <input
                            type="date"
                            value={item.endDate}
                            onChange={(e) => {
                              const v = e.target.value;
                              setAcademicBackgrounds((prev) =>
                                prev.map((row, i) =>
                                  i === idx ? { ...row, endDate: v, isCurrent: false } : row
                                )
                              );
                            }}
                            className={`${inputBase} mt-1`}
                            disabled={loading || saving || item.isCurrent}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted">
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={item.isCurrent}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAcademicBackgrounds((prev) =>
                                prev.map((row, i) =>
                                  i === idx
                                    ? {
                                        ...row,
                                        isCurrent: checked,
                                        endDate: checked ? "" : row.endDate,
                                      }
                                    : row
                                )
                              );
                            }}
                            disabled={loading || saving}
                            className="h-3.5 w-3.5 rounded border-base"
                          />
                          Present
                        </label>
                        <button
                          type="button"
                          className="text-[11px] text-red-500 hover:text-red-600"
                          onClick={() =>
                            setAcademicBackgrounds((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={item.id}
                      className="rounded-xl border border-base bg-[rgb(var(--bg))] p-4"
                    >
                      <p className="text-sm font-semibold text-basec">
                        {item.institution?.trim() || "Institution not set"}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatAcademicRange(item)}
                      </p>
                    </div>
                  )
                ))}

                {isEditing && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    onClick={() =>
                      setAcademicBackgrounds((prev) => [
                        ...prev,
                        {
                          id: `${Date.now()}-${prev.length}`,
                          institution: "",
                          startDate: "",
                          endDate: "",
                          isCurrent: false,
                        },
                      ])
                    }
                    disabled={loading || saving}
                  >
                    + Add academic record
                  </button>
                )}
              </div>
            </div>
          )}

          <div
            className={[
              "text-[12px] transition",
              error ? "text-red-500" : "text-transparent",
            ].join(" ")}
            aria-live="polite"
          >
            *{error ?? "\u00A0"}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {isEditing && (
              <button
                type="submit"
                disabled={!canSubmit || saving || loading}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                  !canSubmit || saving || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {saving ? "Saving changes..." : "Save changes"}
              </button>
            )}
          </div>
        </form>
      </section>

      {(profile?.stats || isVerifiedInstructor) && (
        <section className="rounded-2xl bg-surface px-6 py-6 shadow-sm sm:px-8 sm:py-7">
          <h2 className="text-lg font-semibold text-basec">
            {isVerifiedInstructor ? "Teaching overview" : "Learning overview"}
          </h2>

          {/* Verified instructors get instructor-course metrics. Others keep learner progress metrics. */}
          {isVerifiedInstructor ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-base bg-[rgb(var(--bg))] p-4">
                <p className="text-xs font-medium text-muted">Total courses</p>
                <p className="mt-1 text-2xl font-bold text-basec">{instructorMetrics.totalCourses}</p>
              </div>
              <div className="rounded-xl border border-base bg-[rgb(var(--bg))] p-4">
                <p className="text-xs font-medium text-muted">Published courses</p>
                <p className="mt-1 text-2xl font-bold text-basec">{instructorMetrics.publishedCourses}</p>
              </div>
              <div className="rounded-xl border border-base bg-[rgb(var(--bg))] p-4">
                <p className="text-xs font-medium text-muted">Pending courses</p>
                <p className="mt-1 text-2xl font-bold text-basec">{instructorMetrics.pendingCourses}</p>
              </div>
              <div className="rounded-xl border border-base bg-[rgb(var(--bg))] p-4">
                <p className="text-xs font-medium text-muted">Points</p>
                <p className="mt-1 text-2xl font-bold text-basec">{profile?.stats?.points ?? 0}</p>
              </div>
            </div>
          ) : profile?.stats ? (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-5">
                <div className="rounded-xl border border-base bg-[rgb(var(--bg))] p-4">
                  <p className="text-xs font-medium text-muted">Enrolled courses</p>
                  <p className="mt-1 text-2xl font-bold text-basec">
                    {profile.stats.enrolledCoursesCount}
                  </p>
                </div>
                <div className="rounded-xl border border-base bg-[rgb(var(--bg))] p-4">
                  <p className="text-xs font-medium text-muted">Completed courses</p>
                  <p className="mt-1 text-2xl font-bold text-basec">
                    {profile.stats.completedCoursesCount}
                  </p>
                </div>
                <div className="rounded-xl border border-base bg-[rgb(var(--bg))] p-4">
                  <p className="text-xs font-medium text-muted">Certificates earned</p>
                  <p className="mt-1 text-2xl font-bold text-basec">
                    {profile.stats.certificatesCount}
                  </p>
                </div>
                <div className="rounded-xl border border-base bg-[rgb(var(--bg))] p-4">
                  <p className="text-xs font-medium text-muted">Points</p>
                  <p className="mt-1 text-2xl font-bold text-basec">
                    {profile.stats.points}
                  </p>
                </div>
                <div className="rounded-xl border border-base bg-[rgb(var(--bg))] p-4">
                  <p className="text-xs font-medium text-muted">Badges</p>
                  <p className="mt-1 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                    {profile.stats.badge}
                  </p>
                </div>
              </div>

              {(profile.stats.enrolledCourses.length > 0 ||
                profile.stats.completedCourses.length > 0) && (
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  {profile.stats.enrolledCourses.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-basec">Enrolled courses</h3>
                      <div className="mt-3 space-y-2">
                        {profile.stats.enrolledCourses.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-3 rounded-lg border border-base px-3 py-2 text-sm hover:bg-[rgb(var(--bg))] cursor-pointer"
                            onClick={() => nav(`/courses/${c.id}`)}
                          >
                            {c.thumbnailUrl ? (
                              <img
                                src={c.thumbnailUrl}
                                alt={c.title}
                                className="h-9 w-9 rounded-md object-cover"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-md bg-gray-200" />
                            )}
                            <span className="line-clamp-2 text-sm text-basec">{c.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.stats.completedCourses.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-basec">Completed courses</h3>
                      <div className="mt-3 space-y-2">
                        {profile.stats.completedCourses.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-3 rounded-lg border border-base px-3 py-2 text-sm hover:bg-[rgb(var(--bg))] cursor-pointer"
                            onClick={() => nav(`/courses/${c.id}`)}
                          >
                            {c.thumbnailUrl ? (
                              <img
                                src={c.thumbnailUrl}
                                alt={c.title}
                                className="h-9 w-9 rounded-md object-cover"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-md bg-gray-200" />
                            )}
                            <span className="line-clamp-2 text-sm text-basec">{c.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </section>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Save profile changes?"
        description="Your profile information will be updated for your account and visible to others where applicable."
        confirmText="Save changes"
        cancelText="Go back"
        tone="primary"
        loading={confirmLoading}
        disabled={!canSubmit || saving || loading}
        onConfirm={doSaveProfile}
        onClose={() => {
          if (!confirmLoading) {
            setConfirmOpen(false);
          }
        }}
      />
    </div>
  );
};

export default ProfilePage;
