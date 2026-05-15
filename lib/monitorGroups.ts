export interface DayStatus {
  date: string;
  status: "up" | "down" | "maintenance";
}

export interface MonitorEntry {
  betterStackName: string;
  displayName?: string; // if omitted, falls back to betterStackName
}

export interface MonitorGroup {
  name: string;
  monitors: MonitorEntry[];
}

export function getMonitorDisplayName(entry: MonitorEntry): string {
  return entry.displayName ?? entry.betterStackName;
}

export const MONITOR_GROUPS: MonitorGroup[] = [
  {
    name: "AI Engage Messaging",
    monitors: [
      { betterStackName: "Response Path", displayName: "AI Messaging" },
      { betterStackName: "Live Messaging - Dashboard" },
      { betterStackName: "Invoicer (Customers)", displayName: "Invoicer" },
      { betterStackName: "LiveJoin3 Admin Page" },
      { betterStackName: "Rocket.Chat" },
    ],
  },
  {
    name: "AI Lead Response",
    monitors: [
      { betterStackName: "Torpedo" },
    ],
  },
  {
    name: "Awareness Solutions",
    monitors: [
      { betterStackName: "AdCenter" },
      { betterStackName: "AdCenter - Reseller Portal" },
      { betterStackName: "AdEz" },
      { betterStackName: "Amazon OTT" },
      { betterStackName: "Portal.Ad-Ez" },
      { betterStackName: "Search Results Pages" },
      { betterStackName: "TikTok Advertising" },
    ],
  },
  // {
  //   name: "BestRide",
  //   monitors: [
  //     { betterStackName: "BestRide" },
  //     { betterStackName: "BestRide.com Blog" },
  //     { betterStackName: "BestRide Dashboard" },
  //     { betterStackName: "BestRide Validation Services" },
  //   ],
  // },
  {
    name: "Consumer Data & Experience Platform",
    monitors: [
      { betterStackName: "CDXP Platform" },
      { betterStackName: "CDXP Accelerator" },
      { betterStackName: "Digital Dealer Evaluation - Reporting" },
    ],
  },
  {
    name: "General or Shared Infrastructure",
    monitors: [
      { betterStackName: "Communication API" },
      { betterStackName: "DAS API" },
      { betterStackName: "DAS Feedhub" },
      { betterStackName: "Microsoft Outlook" },
      { betterStackName: "General Motors - Dealer Program Enrollment" },
    ],
  },
  {
    name: "LotVantage",
    monitors: [
      { betterStackName: "LotVantage" },
    ],
  },
  {
    name: "Social Media and Reputation Management",
    monitors: [
      { betterStackName: "Account Management Application" },
      { betterStackName: "Mission Control", displayName: "MissionControl" },
      { betterStackName: "MRS Main Page" },
      { betterStackName: "Social Account Management Application" },
      { betterStackName: "Radar" },
      { betterStackName: "Authenticom - DealerVault" },
      { betterStackName: "SOCI" },
    ],
  },
  {
    name: "Review Ingestion",
    monitors: [
      { betterStackName: "Cars.com Review Ingestion" },
      { betterStackName: "CarFax Review Ingestion" },
      { betterStackName: "DealerRater Review Ingestion" },
      { betterStackName: "Edmunds.com Review Ingestion" },
      { betterStackName: "Facebook Review Ingestion" },
      { betterStackName: "Google Review Ingestion" },
      { betterStackName: "Vendasta Review Ingestion" },
      { betterStackName: "Mozenda Review Ingestion" },
    ],
  },
];

export const normalizeMonitorName = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[\s ]+/g, " ")
    .replace(/[–-]/g, "-")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"');

export const GROUPED_MONITOR_NAMES = new Set(
  MONITOR_GROUPS.flatMap((g) => g.monitors.map((m) => normalizeMonitorName(m.betterStackName)))
);
