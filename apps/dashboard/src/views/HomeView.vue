<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { useStandupData } from '../composables/useStandupData';

const { t, locale } = useI18n();
const { load, latest, history, isLoading, hasError, error, isEmpty } = useStandupData();

onMounted(() => {
  load();
});

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value));

const aggregatedStats = computed(() => {
  const records = history.value.length ? history.value : latest.value ? [latest.value] : [];

  const repoSet = new Set<string>();
  let prCount = 0;

  records.forEach((record) => {
    record.activity.forEach((activity) => {
      repoSet.add(activity.repository);
      prCount += 1;
    });
  });

  const bulletCount = latest.value?.summaryBullets.length ?? 0;

  return {
    repos: repoSet.size,
    prs: prCount,
    bullets: bulletCount,
  };
});

const statCards = computed(() => {
  const stats = aggregatedStats.value;
  const format = numberFormatter.value;

  return [
    {
      label: t('home.stats.repos.label'),
      value: format.format(stats.repos),
      description: t('home.stats.repos.description', { count: stats.repos }),
    },
    {
      label: t('home.stats.pullRequests.label'),
      value: format.format(stats.prs),
      description: t('home.stats.pullRequests.description', { count: stats.prs }),
    },
    {
      label: t('home.stats.bullets.label'),
      value: format.format(stats.bullets),
      description: t('home.stats.bullets.description', { count: stats.bullets }),
    },
  ];
});
</script>

<template>
  <section class="relative flex flex-col gap-10 py-16">
    <div
      class="absolute inset-0 -z-[1] overflow-hidden rounded-[28px] border border-white/5 bg-gradient-to-br from-white/5 via-transparent to-white/10 shadow-glow"
    >
      <div
        class="h-full w-full bg-[radial-gradient(circle_at_20%_-10%,rgba(75,188,255,0.4),transparent_45%),radial-gradient(circle_at_80%_120%,rgba(139,92,246,0.4),transparent_55%)] blur-2xl"
      />
    </div>

    <header class="relative flex flex-col gap-6 px-6 pt-12 text-center sm:px-12">
      <p class="section-heading mx-auto">{{ t('home.hero.eyebrow') }}</p>
      <h1 class="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
        {{ t('home.hero.title') }}
      </h1>
      <p class="mx-auto max-w-2xl text-lg text-white/70">
        {{ t('home.hero.body') }}
      </p>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <RouterLink
          to="/standup"
          class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-primary shadow-glow transition hover:bg-primary/40 hover:text-black"
        >
          {{ t('home.hero.ctaDashboard') }}
        </RouterLink>
        <RouterLink
          to="/docs"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/70 transition hover:bg-white/10"
        >
          {{ t('home.hero.ctaDocs') }}
        </RouterLink>
      </div>
    </header>

    <div class="relative px-6 sm:px-12">
      <div v-if="isLoading" class="glass-panel rounded-3xl p-6 text-sm text-white/60">
        {{ t('status.loading') }}
      </div>
      <div
        v-else-if="hasError"
        class="glass-panel flex flex-col gap-3 rounded-3xl p-6 text-sm text-white/60"
      >
        <p>{{ t('status.error') }}</p>
        <p>{{ error }}</p>
        <button
          class="self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:bg-white/10"
          @click="load(true)"
        >
          {{ t('status.retry') }}
        </button>
      </div>
      <div v-else class="grid gap-4 sm:grid-cols-3">
        <article
          v-for="stat in statCards"
          :key="stat.label"
          class="glass-panel flex flex-col gap-2 rounded-2xl p-6"
        >
          <p class="text-sm uppercase tracking-[0.3em] text-white/50">{{ stat.label }}</p>
          <p class="text-4xl font-semibold text-primary">{{ stat.value }}</p>
          <p class="text-sm text-white/60">{{ stat.description }}</p>
        </article>
        <div v-if="isEmpty" class="glass-panel col-span-full rounded-2xl p-6 text-sm text-white/60">
          {{ t('status.empty') }}
        </div>
      </div>
    </div>
  </section>
</template>
