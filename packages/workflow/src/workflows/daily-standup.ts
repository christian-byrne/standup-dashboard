import { RetryableError, sleep } from 'workflow';
import { Temporal } from '@js-temporal/polyfill';
import {
  createGithubService,
  type PullRequestSummary
} from '@standup/services-github';
import { createClaudeService } from '@standup/services-claude';
import { createFileStorage } from '@standup/storage-fs';

type SchedulerOptions = {
  hour: number;
  minute?: number;
  timeZone?: string;
  runImmediately?: boolean;
};

type StandupWorkflowOptions = {
  username: string;
  hours?: number;
  schedule?: SchedulerOptions | null;
  storageDirEnv?: string;
  claudeModel?: string;
};

type PersistedStandup = {
  generatedAt: string;
  dateKey: string;
  username: string;
  hours: number;
  claudeModel?: string;
  rawBullets: string[];
  summaryBullets: string[];
  activity: PullRequestSummary[];
};

type StandupRunResult = {
  generatedAt: string;
  dateKey: string;
  hours: number;
  claudeModel?: string;
  rawBullets: string[];
  summaryBullets: string[];
};

const DEFAULT_SCHEDULE: Required<Pick<SchedulerOptions, 'hour' | 'minute' | 'timeZone'>> = {
  hour: 21,
  minute: 0,
  timeZone: 'America/Los_Angeles',
};

const DEFAULT_SUMMARY_INSTRUCTIONS = `Write exactly 2-4 bullet points about the development work below. Focus on ACTUAL functionality built, not vague themes.

CRITICAL: Start immediately with bullet points. No introduction, headers, or explanations.

Extract the real functionality from PR titles. Be specific about what was actually implemented:

Good examples:
❌ "Improved frontend UX with navigation fixes" (too vague)
✅ "Added tab restoration when closing current tab"

❌ "Enhanced testing infrastructure" (what was enhanced?)  
✅ "Added cloud E2E testing with automated CI checks"

❌ "Optimized telemetry" (how?)
✅ "Reduced telemetry heartbeat from 30sec to 5min intervals"

Rules:
- Capture the SPECIFIC feature/fix implemented
- 8-15 words per bullet
- Group only truly identical work (like "disable telemetry" across repos)
- Use concrete action verbs: Added, Fixed, Reduced, Enabled, Built
- If no meaningful work: "No notable development work"

Focus on what users/systems can now DO differently.
`;

function computeNextTriggerDate(options: Required<Pick<SchedulerOptions, 'hour' | 'minute' | 'timeZone'>>): Date {
  const now = Temporal.Now.zonedDateTimeISO(options.timeZone);
  let scheduled = now.with({ hour: options.hour, minute: options.minute, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });

  if (scheduled <= now) {
    scheduled = scheduled.add({ days: 1 });
  }

  return new Date(scheduled.toInstant().epochMilliseconds);
}

function getSchedule(options?: SchedulerOptions | null) {
  const base = { ...DEFAULT_SCHEDULE };
  if (!options) {
    return { ...base, runImmediately: true };
  }

  return {
    hour: options.hour ?? base.hour,
    minute: options.minute ?? base.minute,
    timeZone: options.timeZone ?? base.timeZone,
    runImmediately: options.runImmediately ?? true,
  };
}

export async function dailyStandupWorkflow(options: StandupWorkflowOptions) {
  'use workflow';

  if (!options?.username) {
    throw new Error('dailyStandupWorkflow requires a GitHub username.');
  }

  const schedule = getSchedule(options.schedule);
  let iteration = 0;

  while (true) {
    if (iteration === 0) {
      if (schedule.runImmediately === false) {
        const next = computeNextTriggerDate(schedule);
        await sleep(next);
      }
    } else {
      const next = computeNextTriggerDate(schedule);
      await sleep(next);
    }

    await runStandupOnce(options);
    iteration += 1;
  }
}

export async function generateStandupOnceWorkflow(options: StandupWorkflowOptions) {
  'use workflow';

  if (!options?.username) {
    throw new Error('generateStandupOnceWorkflow requires a GitHub username.');
  }

  return runStandupOnce(options);
}

/**
 * Convenience helper for local scripts/tests that want the standup payload
 * without spinning up the workflow runtime.
 */
export async function runStandupOnceLocal(options: StandupWorkflowOptions) {
  return runStandupOnce(options);
}

async function runStandupOnce(options: StandupWorkflowOptions): Promise<StandupRunResult> {
  const hours = options.hours ?? 24;
  const generatedAt = new Date().toISOString();
  const dateKey = generatedAt.slice(0, 10);

  const activity = await collectGithubActivityStep({
    username: options.username,
    hours,
  });

  const summary = await summarizeWithClaudeStep({
    activity,
    username: options.username,
    hours,
    claudeModel: options.claudeModel,
  });

  await persistStandupStep({
    generatedAt,
    dateKey,
    hours,
    username: options.username,
    summaryBullets: summary.summaryBullets,
    rawBullets: summary.rawBullets,
    claudeModel: summary.model,
    activity,
    storageDirEnv: options.storageDirEnv,
  });

  return {
    generatedAt,
    dateKey,
    hours,
    claudeModel: summary.model,
    rawBullets: summary.rawBullets,
    summaryBullets: summary.summaryBullets,
  };
}

type CollectGithubActivityParams = {
  username: string;
  hours: number;
};

type CollectGithubActivityResult = PullRequestSummary[];

async function collectGithubActivityStep(params: CollectGithubActivityParams): Promise<CollectGithubActivityResult> {
  'use step';
  const { username, hours } = params;

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('Missing GITHUB_TOKEN environment variable for GitHub access.');
  }

  const service = createGithubService({ token });
  const sinceISO = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return service.searchRecentPullRequests({ username, sinceISO });
}

type SummarizeWithClaudeParams = {
  activity: PullRequestSummary[];
  username: string;
  hours: number;
  claudeModel?: string;
};

type SummarizeWithClaudeResult = {
  rawBullets: string[];
  summaryBullets: string[];
  model: string;
};

async function summarizeWithClaudeStep(params: SummarizeWithClaudeParams): Promise<SummarizeWithClaudeResult> {
  'use step';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable for Claude access.');
  }

  const claudeModel = params.claudeModel ?? process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022';
  const rawBullets = params.activity.length
    ? params.activity.map((item) => {
        const stateTag = item.state === 'merged' ? ':pr-merged:' : item.state === 'open' ? ':pr-open:' : ':pr-closed:';
        return `- ${stateTag} ${item.title} [${item.repository}] (${item.url})`;
      })
    : ['- No GitHub PR activity recorded in this window.'];

  const claude = createClaudeService({
    apiKey,
    model: claudeModel,
    maxTokens: 600,
    temperature: 0.4
  });

  try {
    const summary = await claude.summarize({
      username: params.username,
      hours: params.hours,
      rawBullets,
      promptInstructions: DEFAULT_SUMMARY_INSTRUCTIONS
    });

    return {
      rawBullets,
      summaryBullets: summary.summaryBullets,
      model: claudeModel,
    };
  } catch (error) {
    const retryAfter = (error as { retryAfter?: number }).retryAfter;
    if (retryAfter) {
      throw new RetryableError('Claude rate limit hit. Retrying later.', { retryAfter });
    }
    throw error;
  }
}

type PersistStandupStepParams = PersistedStandup & {
  storageDirEnv?: string;
};

async function persistStandupStep(params: PersistStandupStepParams): Promise<void> {
  'use step';
  const path = await import('node:path');
  const storageDir = params.storageDirEnv ?? process.env.STANDUP_STORAGE_DIR ?? path.join(process.cwd(), 'standup-data');
  const storage = createFileStorage({ rootDir: storageDir });
  const payload: PersistedStandup = {
    generatedAt: params.generatedAt,
    dateKey: params.dateKey,
    username: params.username,
    hours: params.hours,
    claudeModel: params.claudeModel,
    rawBullets: params.rawBullets,
    summaryBullets: params.summaryBullets,
    activity: params.activity,
  };
  await storage.save(payload);
}
