import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  buildAnnualProfile,
  buildRoomHeatmap,
  exposureToCsv,
  exposureToJson,
  simulateDay,
  type ExposureResult,
  type HeatmapResult,
  type MonthlyExposure,
  type RoomGrid,
  type Scenario,
} from "./core";
import {
  Compass,
  CrossSection,
  Heatmap,
  MonthChart,
  NumberField,
  Timeline,
} from "./components";
import { copy, type Language } from "./i18n";
import { defaultPreset, presets, type Preset } from "./presets";

const storageKey = "sillcast-v1";

interface SavedState {
  scenario: Scenario;
  room: RoomGrid;
  language: Language;
}

interface Calculation {
  result: ExposureResult | null;
  heatmap: HeatmapResult | null;
  months: MonthlyExposure[];
  error: string | null;
}

function clonePreset(preset: Preset): { scenario: Scenario; room: RoomGrid } {
  return {
    scenario: structuredClone(preset.scenario),
    room: structuredClone(preset.room),
  };
}

function loadInitialState(): SavedState {
  const fallback = clonePreset(defaultPreset);
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return { ...fallback, language: "en" };
    }
    const parsed = JSON.parse(saved) as Partial<SavedState>;
    if (!parsed.scenario || !parsed.room) {
      return { ...fallback, language: "en" };
    }
    return {
      scenario: parsed.scenario,
      room: parsed.room,
      language: parsed.language === "zh" ? "zh" : "en",
    };
  } catch {
    return { ...fallback, language: "en" };
  }
}

function downloadText(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function durationLabel(minutes: number, language: Language): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (language === "zh") {
    return hours > 0 ? `${hours} 小时 ${remainder} 分钟` : `${remainder} 分钟`;
  }
  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function Section({
  title,
  children,
  badge,
}: {
  title: string;
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <section className="control-section">
      <div className="section-title">
        <h2>{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <article className={accent ? "stat stat-accent" : "stat"}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

export function App() {
  const initial = useMemo(loadInitialState, []);
  const [scenario, setScenario] = useState<Scenario>(initial.scenario);
  const [room, setRoom] = useState<RoomGrid>(initial.room);
  const [language, setLanguage] = useState<Language>(initial.language);
  const [notice, setNotice] = useState("");
  const text = copy[language];
  const deferredScenario = useDeferredValue(scenario);
  const deferredRoom = useDeferredValue(room);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ scenario, room, language } satisfies SavedState),
    );
  }, [scenario, room, language]);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const calculation = useMemo<Calculation>(() => {
    try {
      const result = simulateDay(deferredScenario);
      const heatmap = buildRoomHeatmap(deferredScenario, deferredRoom);
      const months = buildAnnualProfile(deferredScenario);
      return { result, heatmap, months, error: null };
    } catch (error) {
      return {
        result: null,
        heatmap: null,
        months: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [deferredRoom, deferredScenario]);

  const applyPreset = (preset: Preset) => {
    const next = clonePreset(preset);
    setScenario(next.scenario);
    setRoom(next.room);
    setNotice("");
  };

  const updateSite = <Key extends keyof Scenario["site"]>(
    key: Key,
    value: Scenario["site"][Key],
  ) => {
    setScenario((current) => ({
      ...current,
      site: { ...current.site, [key]: value },
    }));
  };

  const updateWindow = <Key extends keyof Scenario["window"]>(
    key: Key,
    value: Scenario["window"][Key],
  ) => {
    setScenario((current) => ({
      ...current,
      window: { ...current.window, [key]: value },
    }));
  };

  const updateTarget = <Key extends keyof Scenario["target"]>(
    key: Key,
    value: Scenario["target"][Key],
  ) => {
    setScenario((current) => ({
      ...current,
      target: { ...current.target, [key]: value },
    }));
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setNotice(text.locateError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setScenario((current) => ({
          ...current,
          site: {
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            timeZone:
              Intl.DateTimeFormat().resolvedOptions().timeZone || current.site.timeZone,
          },
        }));
        setNotice(text.locateSuccess);
      },
      () => setNotice(text.locateError),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  };

  const firstInterval = calculation.result?.intervals[0];
  const lastInterval = calculation.result?.intervals.at(-1);
  const intervalRange =
    firstInterval && lastInterval
      ? `${firstInterval.startLabel} → ${lastInterval.endLabel}`
      : text.noSun;
  const daylightCapture =
    calculation.result && calculation.result.daylightMinutes > 0
      ? (calculation.result.totalMinutes / calculation.result.daylightMinutes) * 100
      : 0;

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#" aria-label="SillCast home">
          <span className="brand-mark">
            <i />
          </span>
          <span>
            <b>SillCast</b>
            <small>{text.tagline}</small>
          </span>
        </a>
        <nav>
          <a
            href="https://github.com/KanadeK/sss/blob/main/docs/MODEL.md"
            target="_blank"
            rel="noreferrer"
          >
            {text.source}
          </a>
          <button
            className="language-button"
            type="button"
            onClick={() => setLanguage((current) => (current === "en" ? "zh" : "en"))}
          >
            {text.language}
          </button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">
              <span />
              OPEN-SOURCE SOLAR GEOMETRY
            </p>
            <h1>{text.title}</h1>
            <p className="hero-copy">{text.intro}</p>
          </div>
          <div className="privacy-pill">
            <span className="lock-icon">⌾</span>
            {text.privacy}
          </div>
        </section>

        <section className="preset-strip" aria-label={text.presets}>
          <span>{text.presets}</span>
          <div>
            {presets.map((preset) => (
              <button key={preset.id} type="button" onClick={() => applyPreset(preset)}>
                {language === "zh" ? preset.labelZh : preset.label}
              </button>
            ))}
          </div>
        </section>

        <div className="workspace">
          <aside className="controls">
            <Section title={text.place}>
              <div className="field-grid">
                <NumberField
                  label={text.latitude}
                  value={scenario.site.latitude}
                  min={-90}
                  max={90}
                  step={0.0001}
                  onChange={(value) => updateSite("latitude", value)}
                />
                <NumberField
                  label={text.longitude}
                  value={scenario.site.longitude}
                  min={-180}
                  max={180}
                  step={0.0001}
                  onChange={(value) => updateSite("longitude", value)}
                />
              </div>
              <label className="field">
                <span>{text.timeZone}</span>
                <input
                  type="text"
                  value={scenario.site.timeZone}
                  onChange={(event) => updateSite("timeZone", event.target.value)}
                  spellCheck="false"
                />
              </label>
              <label className="field">
                <span>{text.date}</span>
                <input
                  type="date"
                  value={scenario.date}
                  onChange={(event) =>
                    setScenario((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </label>
              <button className="location-button" type="button" onClick={useLocation}>
                <span>◎</span>
                {text.useLocation}
              </button>
              {notice && <p className="notice">{notice}</p>}
            </Section>

            <Section
              title={text.window}
              badge={<Compass azimuth={scenario.window.azimuthDeg} />}
            >
              <label className="field range-field">
                <span>{text.direction}</span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={scenario.window.azimuthDeg}
                  onChange={(event) =>
                    updateWindow("azimuthDeg", Number(event.target.value))
                  }
                />
                <output>{Math.round(scenario.window.azimuthDeg)}°</output>
              </label>
              <div className="cardinal-row" aria-hidden="true">
                <span>{text.north} 0°</span>
                <span>{text.east} 90°</span>
                <span>{text.south} 180°</span>
                <span>{text.west} 270°</span>
              </div>
              <div className="field-grid">
                <NumberField
                  label={text.width}
                  value={scenario.window.widthM}
                  min={0.1}
                  max={20}
                  onChange={(value) => updateWindow("widthM", value)}
                />
                <NumberField
                  label={text.height}
                  value={scenario.window.heightM}
                  min={0.1}
                  max={20}
                  onChange={(value) => updateWindow("heightM", value)}
                />
              </div>
              <NumberField
                label={text.sill}
                value={scenario.window.sillHeightM}
                min={0}
                max={20}
                onChange={(value) => updateWindow("sillHeightM", value)}
              />
            </Section>

            <Section title={text.target}>
              <div className="field-grid">
                <NumberField
                  label={text.lateral}
                  value={scenario.target.lateralM}
                  min={-20}
                  max={20}
                  onChange={(value) => updateTarget("lateralM", value)}
                />
                <NumberField
                  label={text.depth}
                  value={scenario.target.depthM}
                  min={0}
                  max={50}
                  onChange={(value) => updateTarget("depthM", value)}
                />
              </div>
              <NumberField
                label={text.targetHeight}
                value={scenario.target.heightM}
                min={0}
                max={20}
                onChange={(value) => updateTarget("heightM", value)}
              />
              <label className="field">
                <span>{text.resolution}</span>
                <select
                  value={scenario.stepMinutes}
                  onChange={(event) =>
                    setScenario((current) => ({
                      ...current,
                      stepMinutes: Number(event.target.value),
                    }))
                  }
                >
                  {[1, 5, 10, 15, 30].map((step) => (
                    <option value={step} key={step}>
                      {step} {text.minutes}
                    </option>
                  ))}
                </select>
              </label>
            </Section>

            <Section title={text.room}>
              <div className="field-grid">
                <NumberField
                  label={text.roomWidth}
                  value={room.widthM}
                  min={0.5}
                  max={50}
                  onChange={(value) =>
                    setRoom((current) => ({ ...current, widthM: value }))
                  }
                />
                <NumberField
                  label={text.roomDepth}
                  value={room.depthM}
                  min={0.5}
                  max={50}
                  onChange={(value) =>
                    setRoom((current) => ({ ...current, depthM: value }))
                  }
                />
              </div>
              <NumberField
                label={text.heatmapHeight}
                value={room.targetHeightM}
                min={0}
                max={20}
                onChange={(value) =>
                  setRoom((current) => ({ ...current, targetHeightM: value }))
                }
              />
            </Section>
          </aside>

          <section className="results" aria-live="polite">
            {calculation.error && (
              <div className="error-card">
                <strong>Check the inputs</strong>
                <span>{calculation.error}</span>
              </div>
            )}

            {calculation.result && calculation.heatmap && (
              <>
                <div className="stats-grid">
                  <Stat
                    label={text.directSun}
                    value={durationLabel(calculation.result.totalMinutes, language)}
                    detail={`${calculation.result.intervals.length} interval${calculation.result.intervals.length === 1 ? "" : "s"}`}
                    accent
                  />
                  <Stat label={text.firstLast} value={intervalRange} />
                  <Stat
                    label={text.capture}
                    value={`${daylightCapture.toFixed(1)}%`}
                    detail={`${calculation.result.daylightMinutes} ${text.minutes}`}
                  />
                  <Stat
                    label={text.weighted}
                    value={`${calculation.result.weightedHours.toFixed(2)} h`}
                    detail={`${scenario.stepMinutes} ${text.minutes} resolution`}
                  />
                </div>

                <article className="result-card wide-card">
                  <div className="card-heading">
                    <div>
                      <span className="card-kicker">{scenario.date}</span>
                      <h2>{text.timeline}</h2>
                    </div>
                    <span className="resolution-badge">
                      ±{scenario.stepMinutes} {text.minutes}
                    </span>
                  </div>
                  <Timeline
                    result={calculation.result}
                    daylightLabel={text.daylight}
                    directLabel={text.throughWindow}
                  />
                </article>

                <div className="visual-grid">
                  <article className="result-card">
                    <div className="card-heading">
                      <div>
                        <h2>{text.heatmap}</h2>
                        <p>{text.heatmapHint}</p>
                      </div>
                    </div>
                    <Heatmap
                      heatmap={calculation.heatmap}
                      room={room}
                      target={scenario.target}
                      minutesLabel={text.minutes}
                    />
                  </article>

                  <article className="result-card">
                    <div className="card-heading">
                      <div>
                        <h2>{text.crossSection}</h2>
                        <p>
                          {calculation.result.peak
                            ? `${formatPeak(calculation.result)} · ${Math.round(calculation.result.peak.altitudeDeg)}° altitude`
                            : text.noSun}
                        </p>
                      </div>
                    </div>
                    <CrossSection scenario={scenario} result={calculation.result} />
                  </article>
                </div>

                <article className="result-card wide-card annual-card">
                  <div className="card-heading">
                    <div>
                      <h2>{text.annual}</h2>
                    </div>
                    <span className="year-badge">{scenario.date.slice(0, 4)}</span>
                  </div>
                  <MonthChart
                    months={calculation.months}
                    hint={text.annualHint}
                    minutesLabel={text.minutes}
                  />
                </article>

                <article className="export-card">
                  <div>
                    <span className="export-icon">↧</span>
                    <div>
                      <h2>{text.export}</h2>
                      <p>{text.modelNote}</p>
                    </div>
                  </div>
                  <div className="export-actions">
                    <button
                      type="button"
                      onClick={() =>
                        downloadText(
                          `sillcast-${scenario.date}.csv`,
                          exposureToCsv(calculation.result!),
                          "text/csv",
                        )
                      }
                    >
                      {text.exportCsv}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadText(
                          `sillcast-${scenario.date}.json`,
                          exposureToJson(deferredScenario, calculation.result!),
                          "application/json",
                        )
                      }
                    >
                      {text.exportJson}
                    </button>
                  </div>
                </article>
              </>
            )}
          </section>
        </div>
      </main>

      <footer>
        <div>
          <span className="brand-footer">SillCast</span>
          <p>Open-source indoor sun geometry by KanadeK.</p>
        </div>
        <div>
          <a href="https://github.com/KanadeK/sss">GitHub</a>
          <a href="https://github.com/KanadeK/sss/blob/main/docs/MODEL.md">Model</a>
          <a href="https://github.com/KanadeK/sss/blob/main/LICENSE">MIT</a>
        </div>
      </footer>
    </>
  );
}

function formatPeak(result: ExposureResult): string {
  if (!result.peak) {
    return "—";
  }
  const hour = Math.floor(result.peak.localMinute / 60);
  const minute = result.peak.localMinute % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
