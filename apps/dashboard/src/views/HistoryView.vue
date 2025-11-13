<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStandupData } from '../composables/useStandupData';
import { useFileDownload } from '../composables/useFileDownload';

const { t, locale } = useI18n();
const { load, history, latest, isLoading, hasError, error, isEmpty } = useStandupData();

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

const records = computed(() => {
  if (history.value.length) {
    return history.value;
  }
  return latest.value ? [latest.value] : [];
});

const {
  download: downloadFile,
  status: downloadStatus,
  message: downloadMessage,
} = useFileDownload();

const downloadStatusLabel = computed(() => {
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

const downloadRecord = (dateKey: string) => {
  const filename = `${dateKey}.md`;
  downloadFile(`/api/standups/${dateKey}.md`, filename);
};
</script>

<template>
  <main class="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
    <header class="flex flex-col gap-2">
      <p class="section-heading">{{ t('history.header.eyebrow') }}</p>
      <h1 class="text-3xl font-semibold">{{ t('history.header.title') }}</h1>
      <p class="max-w-2xl text-sm text-white/60">
        {{ t('history.header.body') }}
      </p>
    </header>

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
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="record in records"
        :key="record.dateKey"
        class="glass-panel flex flex-col gap-3 rounded-3xl p-6 transition hover:border-primary/30 hover:shadow-glow"
      >
        <p class="text-xs uppercase tracking-[0.35em] text-white/40">
          {{ dateFormatter.format(new Date(record.generatedAt)) }}
        </p>
        <p class="text-2xl font-semibold text-primary">
          {{ t('history.card.bullets', { count: record.summaryBullets.length }) }}
        </p>
        <ul class="flex flex-col gap-1 text-xs text-white/50">
          <li v-for="bullet in record.summaryBullets.slice(0, 3)" :key="bullet">
            {{ bullet }}
          </li>
        </ul>
        <button
          class="mt-auto inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="downloadStatus === 'loading'"
          @click="downloadRecord(record.dateKey)"
        >
          {{ t('history.card.cta') }}
        </button>
      </article>
      <div
        v-if="!records.length || isEmpty"
        class="glass-panel rounded-3xl p-6 text-sm text-white/60"
      >
        {{ t('history.empty') }}
      </div>
    </div>
    <p v-if="downloadStatusLabel" class="text-xs uppercase tracking-[0.3em] text-white/40">
      {{ downloadStatusLabel }}
    </p>
  </main>
</template>
