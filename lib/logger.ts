import path from "path";
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";
const level = process.env.LOG_LEVEL ?? (isDev ? "debug" : "info");
const logToFile = process.env.LOG_TO_FILE === "true";
const logFile = path.join(process.cwd(), "logs", "app.log");

interface TransportTarget {
  target: string;
  level: string;
  options: Record<string, unknown>;
}

function buildDevTransport() {
  const targets: TransportTarget[] = [
    {
      target: "pino-pretty",
      level,
      options: {
        colorize: true,
        ignore: "pid,hostname,service",
        translateTime: "HH:MM:ss",
      },
    },
  ];

  if (logToFile) {
    targets.push({
      target: "pino/file",
      level,
      options: { destination: logFile, mkdir: true },
    });
  }

  return pino.transport({ targets });
}

const logger = pino(
  {
    level,
    base: { service: "app-support-portal" },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  isDev ? buildDevTransport() : undefined
);

export default logger;
