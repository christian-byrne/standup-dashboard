import { z } from 'zod';

type RawEnv = Record<string, string | undefined>;

type AppConfig = {
  githubUsername?: string;
  lookbackHours: number;
  storageDir?: string;
  anthropicModel: string;
  anthropicApiKey?: string;
  githubToken?: string;
  timezone: string;
  scheduleHour: number;
  scheduleMinute: number;
  runImmediately: boolean;
};

export const envSchema = z.object({
  STANDUP_GITHUB_USERNAME: z.string().trim().min(1).optional(),
  STANDUP_LOOKBACK_HOURS: z.coerce.number().int().positive().default(24),
  STANDUP_STORAGE_DIR: z.string().trim().min(1).optional(),
  ANTHROPIC_MODEL: z.string().trim().min(1).default('claude-3-5-sonnet-20241022'),
  ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
  GITHUB_TOKEN: z.string().trim().min(1).optional(),
  STANDUP_TIMEZONE: z.string().trim().min(1).default('America/Los_Angeles'),
  STANDUP_SCHEDULE_HOUR: z.coerce.number().int().min(0).max(23).default(21),
  STANDUP_SCHEDULE_MINUTE: z.coerce.number().int().min(0).max(59).default(0),
  STANDUP_RUN_IMMEDIATELY: z.coerce.boolean().default(true)
});

let cachedConfig: AppConfig | null = null;

function parseEnv(raw: RawEnv): AppConfig {
  const parsed = envSchema.parse(raw);

  return {
    githubUsername: parsed.STANDUP_GITHUB_USERNAME,
    lookbackHours: parsed.STANDUP_LOOKBACK_HOURS,
    storageDir: parsed.STANDUP_STORAGE_DIR,
    anthropicModel: parsed.ANTHROPIC_MODEL,
    anthropicApiKey: parsed.ANTHROPIC_API_KEY,
    githubToken: parsed.GITHUB_TOKEN,
    timezone: parsed.STANDUP_TIMEZONE,
    scheduleHour: parsed.STANDUP_SCHEDULE_HOUR,
    scheduleMinute: parsed.STANDUP_SCHEDULE_MINUTE,
    runImmediately: parsed.STANDUP_RUN_IMMEDIATELY
  };
}

export function loadConfig(overrides?: RawEnv): AppConfig {
  const merged: RawEnv = { ...process.env, ...overrides };
  return parseEnv(merged);
}

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

export type { AppConfig };
