import { z } from "zod";

/**
 * Typed application configuration (ARCHITECTURE.md section 14).
 * Validated once with zod; the app fails fast on invalid configuration.
 * Loaded lazily so `next build` and tests never require real secrets.
 * Secrets come from environment variables only - never commit them.
 */

const configSchema = z.object({
  env: z.enum(["development", "test", "production"]),
  database: z.object({
    url: z.string().min(1),
  }),
  zugferdWorker: z.object({
    baseUrl: z.string().url(),
    timeoutMs: z.coerce.number().int().positive().default(30000),
  }),
  storage: z.object({
    endpoint: z.string().min(1),
    region: z.string().min(1),
    bucket: z.string().min(1),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
  }),
  logging: z.object({
    level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return configSchema.parse({
    env: env.NODE_ENV ?? "development",
    database: { url: env.DATABASE_URL },
    zugferdWorker: {
      baseUrl: env.ZUGFERD_WORKER_URL,
      timeoutMs: env.ZUGFERD_WORKER_TIMEOUT_MS,
    },
    storage: {
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    logging: { level: env.LOG_LEVEL },
  });
}

let cached: AppConfig | undefined;

/** Lazily loaded process-wide config (server code paths only). */
export function getConfig(): AppConfig {
  cached ??= loadConfig();
  return cached;
}
