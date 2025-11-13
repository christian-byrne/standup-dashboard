#!/usr/bin/env node
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { loadConfig } from '@standup/config';
import { runStandupOnceLocal } from '../workflows/daily-standup';

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

  console.log(`▶️  Running standup locally for @${config.githubUsername} (last ${config.lookbackHours}h)`);
  const result = await runStandupOnceLocal({
    username: config.githubUsername,
    hours: config.lookbackHours,
    claudeModel: config.anthropicModel,
    storageDirEnv: config.storageDir,
  });

  console.log('✅ Standup complete. Summary bullets:');
  for (const bullet of result.summaryBullets) {
    console.log(`  ${bullet}`);
  }
  console.log('\n📄 Raw bullets written to storage directory.');
}

main().catch((error) => {
  console.error('❌ Failed to run standup');
  console.error(error);
  process.exit(1);
});
