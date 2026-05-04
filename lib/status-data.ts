// lib/status-data.ts

import { Service } from "@/types/status";

export const services: Service[] = [
    // --- INFRASTRUCTURE ---
    {
        id: "azure",
        name: "Microsoft Azure",
        category: "infrastructure",
        description: "Cloud infrastructure, hosting, and platform services",
        statusPageUrl: "https://azure.status.microsoft/en-us/status",
        statusApiUrl: "https://azurestatuscdn.azureedge.net/en-us/status/feed/",
        currentStatus: "operational",
        lastChecked: new Date().toISOString(),
    },
    {
        id: "aws",
        name: "Amazon Web Services",
        category: "infrastructure",
        description: "EC2, Lambda, and S3 in us-east-1 and us-east-2",
        statusPageUrl: "https://health.aws.amazon.com/health/status",
        statusApiUrl: [
            "https://status.aws.amazon.com/rss/ec2-us-east-1.rss",
            "https://status.aws.amazon.com/rss/ec2-us-east-2.rss",
            "https://status.aws.amazon.com/rss/lambda-us-east-1.rss",
            "https://status.aws.amazon.com/rss/lambda-us-east-2.rss",
            "https://status.aws.amazon.com/rss/s3-us-east-1.rss",
            "https://status.aws.amazon.com/rss/s3-us-east-2.rss",
        ].join(","),
        currentStatus: "operational",
        lastChecked: new Date().toISOString(),
    },
    {
        id: "twilio",
        name: "Twilio",
        category: "infrastructure",
        description: "SMS and messaging APIs",
        statusPageUrl: "https://status.twilio.com",
        statusApiUrl: "https://status.twilio.com/api/v2/summary.json",
        watchComponents: ["Messaging", "SMS", "US1", "US2"],
        currentStatus: "operational",
        lastChecked: new Date().toISOString(),
    },
    {
        id: "sendgrid",
        name: "SendGrid",
        category: "infrastructure",
        description: "Transactional and marketing email delivery",
        statusPageUrl: "https://status.sendgrid.com",
        statusApiUrl: "https://status.sendgrid.com/api/v2/summary.json",
        currentStatus: "operational",
        lastChecked: new Date().toISOString(),
    },
    {
        id: "mailgun",
        name: "Mailgun",
        category: "infrastructure",
        description: "Email delivery and tracking API",
        statusPageUrl: "https://status.mailgun.com",
        statusApiUrl: "https://status.mailgun.com/api/v2/summary.json",
        currentStatus: "operational",
        lastChecked: new Date().toISOString(),
    },
    // --- ADVERTISING ---
    // --- ADVERTISING ---
    {
        id: "microsoft-ads",
        name: "Microsoft Advertising",
        category: "advertising",
        description: "Automated Inventory Ads and paid search campaigns",
        statusPageUrl: "https://status.ads.microsoft.com",
        rssFeedUrls: ["https://status.ads.microsoft.com/feed"],
        currentStatus: "operational",
        lastChecked: new Date().toISOString(),
    },
    {
        id: "google-ads",
        name: "Google Ads / Merchant Center",
        category: "advertising",
        description: "Shopping campaigns and Google Merchant Center feed",
        statusPageUrl: "https://ads.google.com/status/publisher/en/",
        // No public status RSS feed available — manually maintained
        currentStatus: "operational",
        lastChecked: new Date().toISOString(),
    },
    {
        id: "meta-ads",
        name: "Meta Ads",
        category: "advertising",
        description: "Facebook and Instagram paid ad campaigns",
        statusPageUrl: "https://metastatus.com",
        statusApiUrl: "https://metastatus.com/outage-events-feed-ads-manager.rss",
        currentStatus: "operational",
        lastChecked: new Date().toISOString(),
    },
];

export const servicesByCategory = {
    infrastructure: services.filter((s) => s.category === "infrastructure"),
    advertising: services.filter((s) => s.category === "advertising"),
};

export function getOverallStatus(): "operational" | "maintenance" | "issues" | "outage" {
    const statuses = services.map((s) => s.currentStatus);
    if (statuses.includes("major_outage")) return "outage";
    if (statuses.includes("partial_outage") || statuses.includes("degraded")) return "issues";
    if (statuses.includes("maintenance")) return "maintenance";
    return "operational";
}