export interface StandupActivity {
  title: string;
  repository: string;
  url: string;
  state: 'open' | 'closed' | 'merged';
  mergedAt?: string | null;
  updatedAt: string;
}

export interface StandupRecord {
  generatedAt: string;
  dateKey: string;
  username: string;
  hours: number;
  claudeModel?: string;
  rawBullets: string[];
  summaryBullets: string[];
  activity: StandupActivity[];
}

const API_BASE = '/api/standups';

async function getJson<T>(path: string): Promise<T> {
  try {
    const res = await fetch(path, {
      headers: {
        accept: 'application/json',
      },
    });

    if (res.status === 204) {
      return undefined as T;
    }

    if (res.status === 404) {
      return null as T;
    }

    if (!res.ok) {
      // In production without API, return null to trigger fallback
      return null as T;
    }

    return (await res.json()) as T;
  } catch (error) {
    // Network errors or JSON parse errors - return null to trigger fallback
    return null as T;
  }
}

export async function fetchLatestStandup(): Promise<StandupRecord | null> {
  return getJson<StandupRecord | null>(`${API_BASE}/latest`);
}

export async function fetchStandupHistory(limit = 14): Promise<StandupRecord[]> {
  const data = await getJson<{ items: StandupRecord[] } | null>(
    `${API_BASE}/history?limit=${limit}`
  );
  return data?.items ?? [];
}

export function createPlaceholderStandup(): StandupRecord {
  const now = new Date();
  const iso = now.toISOString();
  const dateKey = iso.slice(0, 10);

  return {
    generatedAt: iso,
    dateKey,
    username: 'placeholder-user',
    hours: 24,
    rawBullets: [
      '- :pr-merged: feat: first-pass holographic timeline [standup-dashboard/ui] (https://github.com/example/pr/42)',
      '- :pr-open: fix: claude failover to opus on rate cap [standup-dashboard/workflow] (https://github.com/example/pr/43)',
      '- :pr-merged: chore: provision nightly workflow audit log bucket [infra/terraform] (https://github.com/example/pr/21)',
    ],
    claudeModel: 'claude-3-5-sonnet',
    summaryBullets: [
      'Rolled out holographic timeline pulse renders for the standup dashboard.',
      'Added Claude failover path to Opus when Sonnet throttles due to nightly caps.',
      'Provisioned audit log bucket and access policies ahead of Supabase adapter launch.',
    ],
    activity: [
      {
        title: 'feat: first-pass holographic timeline',
        repository: 'standup-dashboard/ui',
        url: 'https://github.com/example/pr/42',
        state: 'merged',
        mergedAt: iso,
        updatedAt: iso,
      },
      {
        title: 'fix: claude failover to opus on rate cap',
        repository: 'standup-dashboard/workflow',
        url: 'https://github.com/example/pr/43',
        state: 'open',
        mergedAt: null,
        updatedAt: iso,
      },
      {
        title: 'chore: provision nightly workflow audit log bucket',
        repository: 'infra/terraform',
        url: 'https://github.com/example/pr/21',
        state: 'merged',
        mergedAt: iso,
        updatedAt: iso,
      },
    ],
  } satisfies StandupRecord;
}
