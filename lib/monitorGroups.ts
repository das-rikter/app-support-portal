export interface MonitorGroup {
  name: string;
  monitors: string[];
}

export const MONITOR_GROUPS: MonitorGroup[] = [
  {
    name: "AI Engage Messaging",
    monitors: ["Response Path", "Live Messaging - Dashboard", "Invoicer (Customers)", "LiveJoin3 Admin Page", "Rocket.Chat"],
  },
  {
    name: "AI Lead Response",
    monitors: ["Torpedo"],
  },
  {
    name: "Awareness Solutions",
    monitors: ["AdCenter", "AdCenter - Reseller Portal", "AdEz", "Amazon OTT", "Search Results Pages", "TikTok Advertising"],
  },
  {
    name: "BestRide",
    monitors: ["BestRide", "BestRide.com Blog", "BestRide Dashboard", "BestRide Validation Services"],
  },
  {
    name: "Consumer Data & Experience Platform",
    monitors: ["CDXP Platform", "CDXP Accelerator", "Digital Dealer Evaluation - Reporting"],
  },
  {
    name: "General or Shared Infrastructure",
    monitors: ["Communication API", "DAS API", "Vonage", "DAS Feedhub", "Microsoft Outlook", "General Motors - Dealer Program Enrollment"],
  },
  {
    name: "LotVantage",
    monitors: ["LotVantage"],
  },
  {
    name: "Social Media and Reputation Management",
    monitors: ["Account Management Application", "Mission Control", "MRS Main Page", "Social Account Management Application", "Radar", "Authenticom - DealerVault", "SOCI"],
  },
  {
    name: "Review Ingestion",
    monitors: ["Cars.com Review Ingestion", "CarFax Review Ingestion", "DealerRater Review Ingestion", "Edmunds.com Review Ingestion", "Facebook Review Ingestion", "Google Review Ingestion", "Vendasta Review Ingestion", "Mozenda review ingestion"],
  },
];

export const GROUPED_MONITOR_NAMES = new Set(
  MONITOR_GROUPS.flatMap((g) => g.monitors.map((n) => n.toLowerCase()))
);
