import { computed, reactive, toRefs } from 'vue';
import {
  createPlaceholderStandup,
  fetchLatestStandup,
  fetchStandupHistory,
  type StandupActivity,
  type StandupRecord,
} from '../lib/standup-service';

type Status = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

type StandupState = {
  status: Status;
  latest: StandupRecord | null;
  history: StandupRecord[];
  error: string | null;
  lastLoadedAt: number | null;
};

export type TimelinePulse = {
  id: string;
  dateKey: string;
  timestamp: number;
  repository: string;
  state: StandupActivity['state'];
  url: string;
};

const state = reactive<StandupState>({
  status: 'idle',
  latest: null,
  history: [],
  error: null,
  lastLoadedAt: null,
} as StandupState);

async function loadData(force = false) {
  if (state.status === 'loading') return;
  if (!force && (state.status === 'ready' || state.status === 'empty') && state.latest) {
    return;
  }

  state.status = 'loading';
  state.error = null;

  try {
    const [latest, history] = await Promise.all([fetchLatestStandup(), fetchStandupHistory(21)]);

    if (!latest && history.length === 0) {
      state.latest = createPlaceholderStandup();
      state.history = [];
      state.status = 'empty';
      state.lastLoadedAt = Date.now();
      return;
    }

    state.latest = latest ?? createPlaceholderStandup();
    state.history = history.length ? history : latest ? [latest] : [];
    state.status = 'ready';
    state.lastLoadedAt = Date.now();
  } catch (error) {
    state.error = (error as Error).message;
    state.status = 'error';
  }
}

export function useStandupData() {
  const isLoading = computed(() => state.status === 'loading' || state.status === 'idle');
  const isEmpty = computed(() => state.status === 'empty');
  const hasError = computed(() => state.status === 'error');

  const timelinePulses = computed<TimelinePulse[]>(() => {
    const records: StandupRecord[] = [];
    if (state.latest) {
      records.push(state.latest);
    }
    if (state.history.length) {
      records.push(...state.history);
    }

    return records
      .flatMap((record) =>
        record.activity.map((activity, index) => ({
          id: `${record.dateKey}-${index}`,
          dateKey: record.dateKey,
          timestamp: new Date(activity.updatedAt ?? record.generatedAt).getTime(),
          repository: activity.repository,
          state: activity.state,
          url: activity.url,
        }))
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  const timelineDomain = computed(() => {
    const pulses = timelinePulses.value;
    if (!pulses.length) {
      return null;
    }
    const last = pulses[pulses.length - 1];
    const first = pulses[0];
    return {
      start: Math.min(first.timestamp, last.timestamp),
      end: Math.max(first.timestamp, last.timestamp),
    };
  });

  return {
    ...toRefs(state),
    isLoading,
    isEmpty,
    hasError,
    timelineDomain,
    timelinePulses,
    load: (force = false) => loadData(force),
    refresh: () => loadData(true),
  };
}
