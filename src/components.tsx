import type {
  ExposureResult,
  HeatmapResult,
  MonthlyExposure,
  RoomGrid,
  Scenario,
} from "./core";
import { formatLocalMinute } from "./core";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
}: NumberFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function Compass({ azimuth }: { azimuth: number }) {
  return (
    <div className="compass" aria-label={`Window faces ${Math.round(azimuth)} degrees`}>
      <span className="compass-n">N</span>
      <span className="compass-e">E</span>
      <span className="compass-s">S</span>
      <span className="compass-w">W</span>
      <span className="compass-needle" style={{ transform: `rotate(${azimuth}deg)` }} />
      <strong>{Math.round(azimuth)}°</strong>
    </div>
  );
}

export function Timeline({
  result,
  daylightLabel,
  directLabel,
}: {
  result: ExposureResult;
  daylightLabel: string;
  directLabel: string;
}) {
  const width = 720;
  const step = result.samples[1]
    ? result.samples[1].localMinute - result.samples[0]!.localMinute
    : 5;
  const segmentWidth = Math.max(1, (step / 1_440) * width + 0.25);

  return (
    <div className="timeline-wrap">
      <svg
        className="timeline"
        viewBox={`0 0 ${width} 76`}
        role="img"
        aria-label="Daily sunlight timeline"
      >
        <rect x="0" y="12" width={width} height="16" rx="8" className="timeline-base" />
        {result.samples
          .filter((sample) => sample.altitudeDeg > 0)
          .map((sample) => (
            <rect
              key={`day-${sample.localMinute}`}
              x={(sample.localMinute / 1_440) * width}
              y="12"
              width={segmentWidth}
              height="16"
              className="timeline-daylight"
            />
          ))}
        <rect x="0" y="38" width={width} height="18" rx="9" className="timeline-base" />
        {result.samples
          .filter((sample) => sample.direct)
          .map((sample) => (
            <rect
              key={`direct-${sample.localMinute}`}
              x={(sample.localMinute / 1_440) * width}
              y="38"
              width={segmentWidth}
              height="18"
              className="timeline-direct"
            />
          ))}
        {[0, 360, 720, 1_080, 1_440].map((minute) => (
          <g key={minute}>
            <line
              x1={(minute / 1_440) * width}
              x2={(minute / 1_440) * width}
              y1="59"
              y2="64"
              className="timeline-tick"
            />
            <text
              x={(minute / 1_440) * width}
              y="74"
              textAnchor={minute === 0 ? "start" : minute === 1_440 ? "end" : "middle"}
            >
              {formatLocalMinute(minute)}
            </text>
          </g>
        ))}
      </svg>
      <div className="legend">
        <span>
          <i className="legend-daylight" />
          {daylightLabel}
        </span>
        <span>
          <i className="legend-direct" />
          {directLabel}
        </span>
      </div>
    </div>
  );
}

function heatColor(minutes: number, maximum: number): string {
  if (minutes <= 0 || maximum <= 0) {
    return "#e7ebe4";
  }
  const ratio = Math.min(1, minutes / maximum);
  const hue = 48 - ratio * 16;
  const lightness = 91 - ratio * 45;
  return `hsl(${hue} 92% ${lightness}%)`;
}

export function Heatmap({
  heatmap,
  room,
  target,
  minutesLabel,
}: {
  heatmap: HeatmapResult;
  room: RoomGrid;
  target: Scenario["target"];
  minutesLabel: string;
}) {
  const targetColumn = Math.round(
    ((target.lateralM + room.widthM / 2) / room.widthM) * (room.columns - 1),
  );
  const targetRow = Math.round(
    ((target.depthM - 0.05) / Math.max(0.01, room.depthM - 0.05)) * (room.rows - 1),
  );

  return (
    <div className="room-map">
      <div className="window-mark">
        <span />
        <b>WINDOW</b>
        <span />
      </div>
      <div
        className="heat-grid"
        style={{ gridTemplateColumns: `repeat(${heatmap.columns}, 1fr)` }}
        role="img"
        aria-label="Direct sunlight duration heatmap"
      >
        {heatmap.cells.map((cell, index) => {
          const column = index % heatmap.columns;
          const row = Math.floor(index / heatmap.columns);
          const isTarget = column === targetColumn && row === targetRow;
          return (
            <span
              key={`${cell.lateralM}-${cell.depthM}`}
              className={isTarget ? "heat-cell target-cell" : "heat-cell"}
              style={{ backgroundColor: heatColor(cell.minutes, heatmap.maxMinutes) }}
              title={`${cell.lateralM.toFixed(2)} m × ${cell.depthM.toFixed(2)} m: ${cell.minutes} ${minutesLabel}`}
            />
          );
        })}
      </div>
      <div className="heat-scale">
        <span>0</span>
        <i />
        <span>
          {heatmap.maxMinutes} {minutesLabel}
        </span>
      </div>
    </div>
  );
}

export function CrossSection({
  scenario,
  result,
}: {
  scenario: Scenario;
  result: ExposureResult;
}) {
  const scale = 72;
  const wallX = 86;
  const floorY = 242;
  const targetX = wallX + scenario.target.depthM * scale;
  const targetY = floorY - scenario.target.heightM * scale;
  const sillY = floorY - scenario.window.sillHeightM * scale;
  const topY = floorY - (scenario.window.sillHeightM + scenario.window.heightM) * scale;
  const hitY =
    result.peak?.windowZ === null || result.peak?.windowZ === undefined
      ? (sillY + topY) / 2
      : floorY - result.peak.windowZ * scale;

  return (
    <svg
      className="cross-section"
      viewBox="0 0 560 270"
      role="img"
      aria-label="Window and target cross-section at peak direct sun"
    >
      <line x1="30" y1={floorY} x2="530" y2={floorY} className="section-floor" />
      <line x1={wallX} y1="20" x2={wallX} y2={topY} className="section-wall" />
      <line x1={wallX} y1={sillY} x2={wallX} y2={floorY} className="section-wall" />
      <line x1={wallX} y1={topY} x2={wallX} y2={sillY} className="section-window" />
      {result.peak && (
        <>
          <line
            x1="18"
            y1={Math.max(12, hitY - (targetY - hitY) * 0.35)}
            x2={targetX}
            y2={targetY}
            className="section-ray-glow"
          />
          <line
            x1="18"
            y1={Math.max(12, hitY - (targetY - hitY) * 0.35)}
            x2={targetX}
            y2={targetY}
            className="section-ray"
          />
        </>
      )}
      <circle cx={targetX} cy={targetY} r="8" className="section-target" />
      <text x={targetX} y={targetY - 16} textAnchor="middle">
        target
      </text>
      <text x={wallX - 10} y={topY - 8} textAnchor="end">
        window
      </text>
      {!result.peak && (
        <text x="300" y="120" textAnchor="middle" className="section-empty">
          No direct ray on this date
        </text>
      )}
    </svg>
  );
}

export function MonthChart({
  months,
  hint,
  minutesLabel,
}: {
  months: MonthlyExposure[];
  hint: string;
  minutesLabel: string;
}) {
  const names = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const maximum = Math.max(1, ...months.map((month) => month.averageMinutes));
  return (
    <div>
      <p className="card-hint">{hint}</p>
      <div className="month-chart" role="img" aria-label={hint}>
        {months.map((month, index) => (
          <div
            className="month-column"
            key={month.month}
            title={`${month.averageMinutes} ${minutesLabel}; ${month.daysWithSun}/${month.days} days`}
          >
            <span>{month.averageMinutes}</span>
            <i
              style={{ height: `${Math.max(2, (month.averageMinutes / maximum) * 100)}%` }}
            />
            <b>{names[index]}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
