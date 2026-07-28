import type { RoomGrid, Scenario } from "./core";

export interface Preset {
  id: string;
  label: string;
  labelZh: string;
  scenario: Scenario;
  room: RoomGrid;
}

function localToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const date = localToday();

export const presets: Preset[] = [
  {
    id: "tokyo-plant",
    label: "Tokyo · south plant",
    labelZh: "东京 · 南窗植物",
    scenario: {
      name: "Tokyo south-window plant",
      site: { latitude: 35.6762, longitude: 139.6503, timeZone: "Asia/Tokyo" },
      window: { azimuthDeg: 180, widthM: 1.8, heightM: 1.5, sillHeightM: 0.7 },
      target: { lateralM: 0.15, depthM: 1.1, heightM: 0.65 },
      date,
      stepMinutes: 5,
    },
    room: { widthM: 4.5, depthM: 4, targetHeightM: 0.65, columns: 17, rows: 15 },
  },
  {
    id: "london-desk",
    label: "London · east desk",
    labelZh: "伦敦 · 东窗书桌",
    scenario: {
      name: "London east-window desk",
      site: { latitude: 51.5072, longitude: -0.1276, timeZone: "Europe/London" },
      window: { azimuthDeg: 90, widthM: 2.1, heightM: 1.35, sillHeightM: 0.9 },
      target: { lateralM: -0.25, depthM: 1.8, heightM: 0.78 },
      date,
      stepMinutes: 5,
    },
    room: { widthM: 5, depthM: 4.5, targetHeightM: 0.78, columns: 17, rows: 15 },
  },
  {
    id: "sydney-pet",
    label: "Sydney · north pet bed",
    labelZh: "悉尼 · 北窗宠物窝",
    scenario: {
      name: "Sydney north-window pet bed",
      site: {
        latitude: -33.8688,
        longitude: 151.2093,
        timeZone: "Australia/Sydney",
      },
      window: { azimuthDeg: 0, widthM: 2.4, heightM: 1.7, sillHeightM: 0.35 },
      target: { lateralM: 0.4, depthM: 2.2, heightM: 0.2 },
      date,
      stepMinutes: 5,
    },
    room: { widthM: 5.2, depthM: 5, targetHeightM: 0.2, columns: 17, rows: 15 },
  },
];

export const defaultPreset = presets[0]!;
