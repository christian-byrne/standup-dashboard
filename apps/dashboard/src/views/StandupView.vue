<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { useStandupData } from '../composables/useStandupData';
import { useFileDownload } from '../composables/useFileDownload';
import { useClipboard } from '../composables/useClipboard';
import TimelinePulseStream from '../components/TimelinePulseStream.vue';
import SwipeableActivityCard from '../components/SwipeableActivityCard.vue';
import MobileMenu from '../components/MobileMenu.vue';
import MobileLoadingState from '../components/MobileLoadingState.vue';

const { t, locale } = useI18n();
const { load, latest, isLoading, hasError, error, isEmpty, timelinePulses, timelineDomain } =
  useStandupData();

onMounted(() => {
  load();
});

const dateFormatter = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
);

const latestSummaryBullets = computed(() => latest.value?.summaryBullets ?? []);
const activityFeed = computed(() => latest.value?.activity ?? []);
const generatedAt = computed(() => {
  const value = latest.value?.generatedAt;
  return value ? dateFormatter.value.format(new Date(value)) : null;
});
const claudeModel = computed(
  () => (latest.value as { claudeModel?: string } | null)?.claudeModel ?? 'Claude 3.5 Sonnet'
);

const recentPulses = computed(() => timelinePulses.value.slice(0, 5));
const totalPulseCount = computed(() => timelinePulses.value.length);

const {
  download: downloadFile,
  status: downloadStatus,
  message: downloadMessage,
} = useFileDownload();

const clipboard = useClipboard();

const latestDownloadLabel = computed(() => {
  if (downloadStatus.value === 'loading') {
    return t('status.download.loading');
  }
  if (downloadStatus.value === 'success') {
    return t('status.download.success', { filename: downloadMessage.value ?? '' });
  }
  if (downloadStatus.value === 'error') {
    return t('status.download.error', { message: downloadMessage.value ?? '' });
  }
  return null;
});

const handleDownloadLatest = () => {
  const filename = `${latest.value?.dateKey ?? 'latest'}.json`;
  downloadFile('/api/standups/latest.json', filename);
};

const copyBullets = () => {
  const bullets = latestSummaryBullets.value.join('\n');
  clipboard.copy(bullets);
};

const copyActivityFeed = () => {
  const feed = activityFeed.value
    .map(entry => `${entry.title} (${entry.repository}) - ${entry.state}`)
    .join('\n');
  clipboard.copy(feed);
};
</script>

<template>
  <MobileMenu />
  <main class="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-8 p-4 sm:py-10">
    <header class="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 relative">
      <!-- Status Indicator -->
      <div class="absolute -top-4 -left-4 hidden sm:flex items-center gap-2 text-xs text-white/40">
        <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        <span class="uppercase tracking-[0.2em]">Dashboard Active</span>
      </div>
      
      <div class="relative">
        <p class="section-heading data-stream">{{ t('standup.header.eyebrow') }}</p>
        <h1 class="text-2xl sm:text-3xl font-semibold hologram-text" :data-text="t('standup.header.title')">
          {{ t('standup.header.title') }}
        </h1>
      </div>
      
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
        <!-- Status indicators -->
        <div class="flex items-center gap-2 text-xs text-white/50 order-2 sm:order-1">
          <div class="flex items-center gap-1">
            <div class="w-1.5 h-1.5 bg-primary rounded-full pulse-ring"></div>
            <span>{{ timelinePulses.length }} signals</span>
          </div>
        </div>
        
        <RouterLink
          to="/history"
          class="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 transition hover:bg-white/10 terminal-glow cyber-border w-full sm:w-auto order-1 sm:order-2"
        >
          {{ t('standup.header.historyCta') }}
        </RouterLink>
      </div>
    </header>

    <MobileLoadingState v-if="isLoading" />
    <div
      v-else-if="hasError"
      class="glass-panel flex flex-col gap-3 rounded-3xl p-4 sm:p-6 text-sm text-white/60"
    >
      <p>{{ t('status.error') }}</p>
      <p class="text-xs sm:text-sm break-words">{{ error }}</p>
      <button
        class="self-start sm:self-start w-full sm:w-auto rounded-full border border-white/10 bg-white/5 px-4 py-3 sm:py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:bg-white/10 min-h-[44px] sm:min-h-0"
        @click="load(true)"
      >
        {{ t('status.retry') }}
      </button>
    </div>
    <section v-else class="flex flex-col lg:grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <article class="glass-panel rounded-3xl p-4 sm:p-8 scanlines terminal-glow order-2 lg:order-1">
        <div class="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h2 class="text-xl sm:text-2xl font-semibold">{{ t('standup.summary.title') }}</h2>
            <p class="text-sm text-white/60">
              {{
                t('standup.summary.meta', {
                  time: generatedAt ?? '—',
                  model: claudeModel,
                })
              }}
            </p>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <button
              v-if="latestSummaryBullets.length"
              class="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 flex-1 sm:flex-initial"
              :disabled="clipboard.isCopying()"
              @click="copyBullets"
            >
              <span v-if="clipboard.isSuccess()" class="text-emerald-400">✓</span>
              <span v-else-if="clipboard.isError()" class="text-rose-400">✗</span>
              <span v-else>📋</span>
              <span class="hidden sm:inline">{{ clipboard.isSuccess() ? 'Copied!' : 'Copy' }}</span>
            </button>
            <div class="relative">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-primary/10 text-primary pulse-ring"
              >
                AI
              </span>
              <!-- Neural network animation -->
              <div class="absolute inset-0 rounded-full border border-primary/30 animate-ping"></div>
            </div>
          </div>
        </div>
        <ul v-if="latestSummaryBullets.length" class="flex flex-col gap-2 sm:gap-3 text-sm sm:text-base text-white/80">
          <li v-for="item in latestSummaryBullets" :key="item" class="flex items-start gap-2 sm:gap-3">
            <span class="mt-1.5 sm:mt-1 inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary shadow-glow flex-shrink-0" />
            <span class="leading-relaxed">{{ item }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-white/60">{{ t('standup.summary.placeholder') }}</p>
      </article>

      <article class="glass-panel rounded-3xl p-4 sm:p-8 terminal-glow cyber-border order-1 lg:order-2">
        <header class="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <h2 class="text-xl font-semibold">{{ t('standup.timeline.title') }}</h2>
            <p class="text-sm text-white/60">{{ t('standup.timeline.subtitle') }}</p>
          </div>
          <span
            class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary"
            >{{ t('standup.timeline.badge') }}</span
          >
        </header>
        <TimelinePulseStream :pulses="timelinePulses" :domain="timelineDomain">
          <template #empty>
            <span>{{ t('standup.timeline.empty') }}</span>
          </template>
        </TimelinePulseStream>
        <div class="mt-4 text-xs uppercase tracking-[0.3em] text-white/40">
          {{ t('standup.timeline.count', { count: totalPulseCount }) }}
        </div>
        <ul v-if="recentPulses.length" class="mt-2 grid gap-1 text-xs text-white/60">
          <li
            v-for="pulse in recentPulses"
            :key="pulse.id"
            class="flex items-center justify-between gap-2 sm:gap-3 rounded-full border border-white/5 bg-white/5 px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <span class="truncate text-[10px] sm:text-xs">{{ pulse.repository }}</span>
            <span class="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40 flex-shrink-0">{{
              pulse.state
            }}</span>
          </li>
        </ul>
      </article>
    </section>

    <section class="glass-panel rounded-3xl p-4 sm:p-6 terminal-glow data-stream">
      <header
        class="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4"
      >
        <div>
          <h2 class="text-xl font-semibold">{{ t('standup.terminal.title') }}</h2>
          <p class="text-sm text-white/60">{{ t('standup.terminal.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button
            v-if="activityFeed.length"
            class="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 flex-1 sm:flex-initial"
            :disabled="clipboard.isCopying()"
            @click="copyActivityFeed"
          >
            <span v-if="clipboard.isSuccess()" class="text-emerald-400">✓</span>
            <span v-else-if="clipboard.isError()" class="text-rose-400">✗</span>
            <span v-else>📋</span>
            <span class="hidden sm:inline">{{ clipboard.isSuccess() ? 'Copied!' : 'Copy' }}</span>
          </button>
          <button
            class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 flex-1 sm:flex-initial text-center"
            :disabled="downloadStatus === 'loading'"
            @click="handleDownloadLatest"
          >
            <span class="sm:hidden">📥</span>
            <span class="hidden sm:inline">{{ t('standup.terminal.download') }}</span>
          </button>
        </div>
      </header>
      <div class="mt-4">
        <template v-if="activityFeed.length">
          <SwipeableActivityCard 
            :activity="activityFeed" 
            :date-formatter="dateFormatter" 
          />
        </template>
        <p v-else class="text-sm text-white/60">{{ t('standup.terminal.empty') }}</p>
      </div>
      <p v-if="latestDownloadLabel" class="mt-4 text-xs uppercase tracking-[0.3em] text-white/40">
        {{ latestDownloadLabel }}
      </p>
      <p v-if="isEmpty" class="mt-1 text-xs uppercase tracking-[0.3em] text-white/40">
        {{ t('status.empty') }}
      </p>
    </section>
  </main>
</template>
