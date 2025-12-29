// src/pages/admin/SettingsPage.tsx
import { useMemo, useState } from "react";

type Accent = "indigo" | "gray" | "green";

const Icon = {
  Gear: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
        className="stroke-current"
        strokeWidth="1.7"
      />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-1l2-1.2-2-3.6-2.3.6a7.6 7.6 0 0 0-1.7-1l-.3-2.4H10.8l-.3 2.4a7.6 7.6 0 0 0-1.7 1L6.5 9.2 4.5 12.8l2 1.2a7.9 7.9 0 0 0 .1 1l-2 1.2 2 3.6 2.3-.6a7.6 7.6 0 0 0 1.7 1l.3 2.4h4.4l.3-2.4a7.6 7.6 0 0 0 1.7-1l2.3.6 2-3.6-2-1.2z"
        className="stroke-current"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ToggleOn: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M8 7h8a5 5 0 1 1 0 10H8A5 5 0 1 1 8 7z"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M16 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        className="stroke-current"
        strokeWidth="1.7"
      />
    </svg>
  ),
  ToggleOff: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M8 7h8a5 5 0 1 1 0 10H8A5 5 0 1 1 8 7z"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        className="stroke-current"
        strokeWidth="1.7"
      />
    </svg>
  ),
  Save: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M5 4h12l2 2v14H5V4z"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 4v6h8V4"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 20v-6h8v6"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Money: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M4 7h16v10H4V7z"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        className="stroke-current"
        strokeWidth="1.7"
      />
      <path
        d="M7 10h0M17 14h0"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Banner: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M6 3v18"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M6 4h12l-2 4 2 4H6"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Wrench: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M14.7 6.3a4.8 4.8 0 0 0 6 6l-4.1 4.1a3 3 0 0 1-4.2 0l-4.2 4.2a2 2 0 0 1-2.8-2.8l4.2-4.2a3 3 0 0 1 0-4.2L9.7 9.3"
        className="stroke-current"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const ToggleRow = ({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <p className="mt-1 text-sm text-gray-600">{desc}</p>
      </div>

      <button
        type="button"
        className={[
          "shrink-0 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition",
          value
            ? "bg-green-50 text-green-700 ring-green-200 hover:bg-green-100"
            : "bg-white text-gray-800 ring-gray-200 hover:bg-gray-50",
        ].join(" ")}
        onClick={() => onChange(!value)}
      >
        {value ? <Icon.ToggleOn className="h-5 w-5" /> : <Icon.ToggleOff className="h-5 w-5" />}
        {value ? "ON" : "OFF"}
      </button>
    </div>
  );
};

const Badge = ({
  text,
  tone,
}: {
  text: string;
  tone: "green" | "yellow" | "red" | "gray" | "indigo";
}) => {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
      : tone === "red"
      ? "bg-red-50 text-red-700 ring-red-200"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>
      {text}
    </span>
  );
};

const SettingsPage = () => {
  // ✅ Static admin settings (store in DB later)
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enableRegistrations, setEnableRegistrations] = useState(true);
  const [enableMentorsDiscovery, setEnableMentorsDiscovery] = useState(true);
  const [enableFastResponse, setEnableFastResponse] = useState(true);

  const [showPricingPage, setShowPricingPage] = useState(true);
  const [featuredBannerEnabled, setFeaturedBannerEnabled] = useState(true);

  const [bannerTitle, setBannerTitle] = useState("New: SEE Exam Practice Packs");
  const [bannerText, setBannerText] = useState("Try curated questions + verified solutions for Class 10 (SEE).");
  const [bannerLink, setBannerLink] = useState("/courses");
  const [accent, setAccent] = useState<Accent>("indigo");

  const [savedAt, setSavedAt] = useState<string | null>(null);

  const previewTone = useMemo(() => {
    if (maintenanceMode) return "red";
    if (!enableRegistrations) return "yellow";
    return "green";
  }, [maintenanceMode, enableRegistrations]);

  const onSave = () => {
    // ✅ Later: POST /admin/settings
    setSavedAt(new Date().toLocaleString());
    alert("Saved (static demo). Later connect to backend.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Settings</h1>
            <p className="mt-2 text-sm text-gray-600">
              Platform controls, UI banner, pricing toggle, and maintenance mode (static demo).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              text={
                maintenanceMode
                  ? "Maintenance ON"
                  : enableRegistrations
                  ? "Platform Healthy"
                  : "Registrations OFF"
              }
              tone={previewTone as any}
            />
            {savedAt ? <span className="text-xs text-gray-500">Last saved: {savedAt}</span> : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: toggles */}
        <section className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                <Icon.Wrench className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Platform Toggles</h2>
                <p className="mt-1 text-sm text-gray-600">Turn features on/off for the whole app.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ToggleRow
                label="Maintenance Mode"
                desc="If ON, show a maintenance message and disable normal access (frontend + backend later)."
                value={maintenanceMode}
                onChange={setMaintenanceMode}
              />
              <ToggleRow
                label="Enable Registrations"
                desc="If OFF, hide/disable Register page and signup API."
                value={enableRegistrations}
                onChange={setEnableRegistrations}
              />
              <ToggleRow
                label="Enable Mentors Discovery"
                desc="If OFF, hide Mentors page and mentor search."
                value={enableMentorsDiscovery}
                onChange={setEnableMentorsDiscovery}
              />
              <ToggleRow
                label="Enable Fast Response"
                desc="If OFF, disable the priority answer request option."
                value={enableFastResponse}
                onChange={setEnableFastResponse}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                <Icon.Money className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pricing Controls</h2>
                <p className="mt-1 text-sm text-gray-600">Manage pricing visibility (static demo).</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ToggleRow
                label="Show Pricing Page"
                desc="If OFF, hide /pricing route from navbar and disable access."
                value={showPricingPage}
                onChange={setShowPricingPage}
              />
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
              <p className="text-xs font-semibold text-gray-700">Tip</p>
              <p className="mt-1 text-xs text-gray-600">
                Later you can store these in DB as a single settings document, and the frontend can fetch it on app load.
              </p>
            </div>
          </div>
        </section>

        {/* Right column: banner + theme */}
        <section className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                <Icon.Banner className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Featured Banner</h2>
                <p className="mt-1 text-sm text-gray-600">Homepage / announcement banner (demo).</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ToggleRow
                label="Enable Banner"
                desc="If OFF, hide the featured banner on public pages."
                value={featuredBannerEnabled}
                onChange={setFeaturedBannerEnabled}
              />

              <div className="grid gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Title</label>
                  <input
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Banner title"
                    disabled={!featuredBannerEnabled}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Text</label>
                  <textarea
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Short description"
                    rows={3}
                    disabled={!featuredBannerEnabled}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Link</label>
                  <input
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="/courses"
                    disabled={!featuredBannerEnabled}
                  />
                  <p className="mt-1 text-xs text-gray-500">Example: /courses, /questions</p>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold text-gray-500">Preview</p>

                {!featuredBannerEnabled ? (
                  <div className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 ring-1 ring-gray-200">
                    Banner disabled.
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
                    <p className="text-sm font-bold text-indigo-900">{bannerTitle}</p>
                    <p className="mt-1 text-sm text-indigo-800">{bannerText}</p>
                    <p className="mt-2 text-xs text-indigo-700">Link: {bannerLink}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                <Icon.Gear className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Theme (demo)</h2>
                <p className="mt-1 text-sm text-gray-600">This is just UI selection (no real effect yet).</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <label className="text-xs font-semibold text-gray-700">Accent</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["indigo", "gray", "green"] as Accent[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAccent(a)}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      accent === a ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-gray-300 text-gray-800 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {a.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
                <p className="text-xs font-semibold text-gray-700">Selected</p>
                <p className="mt-1 text-sm text-gray-700">
                  Accent: <span className="font-bold">{accent.toUpperCase()}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={onSave}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Icon.Save className="h-4 w-4" />
              Save Settings
            </button>

            <p className="mt-3 text-xs text-gray-500">
              Demo: stored only in component state. Later store in MongoDB and load on app start.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
