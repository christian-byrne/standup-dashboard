#!/usr/bin/env node
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Temporal } from '@js-temporal/polyfill';
import { loadConfig } from '@standup/config';
import { runStandupOnceLocal } from '../workflows/daily-standup';

function computeNextTriggerDate({ hour, minute, timeZone }: { hour: number; minute: number; timeZone: string }) {
  const now = Temporal.Now.zonedDateTimeISO(timeZone);
  let scheduled = now.with({ hour, minute, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
  if (scheduled <= now) {
    scheduled = scheduled.add({ days: 1 });
  }
  return new Date(scheduled.toInstant().epochMilliseconds);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce(username: string, hours: number, storageDirEnv?: string | null, claudeModel?: string | null) {
  const result = await runStandupOnceLocal({
    username,
    hours,
    storageDirEnv: storageDirEnv ?? undefined,
    claudeModel: claudeModel ?? undefined,
  });

  console.log(`[${new Date().toISOString()}] Summary bullets:`);
  for (const bullet of result.summaryBullets) {
    console.log(`  ${bullet}`);
  }
  console.log('---');
}

async function main() {
  const cwd = process.cwd();
  loadEnv({ path: path.join(cwd, '.env') });
  loadEnv({ path: path.join(cwd, '.env.local'), override: true });

  const config = loadConfig();

  if (!config.githubUsername) {
    console.error('Missing STANDUP_GITHUB_USERNAME (set in .env.local or environment).');
    process.exit(1);
  }
  if (!config.githubToken) {
    console.error('Missing GITHUB_TOKEN environment variable.');
    process.exit(1);
  }
  if (!config.anthropicApiKey) {
    console.error('Missing ANTHROPIC_API_KEY environment variable.');
    process.exit(1);
  }

  if (config.runImmediately) {
    await runOnce(config.githubUsername, config.lookbackHours, config.storageDir, config.anthropicModel);
  }

  while (true) {
    const nextDate = computeNextTriggerDate({
      hour: config.scheduleHour,
      minute: config.scheduleMinute,
      timeZone: config.timezone
    });
    const waitMs = nextDate.getTime() - Date.now();
    console.log(`Sleeping until ${nextDate.toLocaleString('en-US', { timeZone: config.timezone })} (${Math.round(waitMs / 1000)}s)...`);
    await sleep(waitMs);
    await runOnce(config.githubUsername, config.lookbackHours, config.storageDir, config.anthropicModel);
  }
}

main().catch((error) => {
  console.error('❌ Failed to run daily standup loop');
  console.error(error);
  process.exit(1);
});
