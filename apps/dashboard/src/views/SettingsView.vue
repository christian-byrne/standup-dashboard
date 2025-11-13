<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const panelKeys = ['credentials', 'scheduling', 'storage', 'prompts'] as const;

const panels = computed(() =>
  panelKeys.map((key) => ({
    key,
    title: t(`settings.panels.${key}.title`),
    copy: t(`settings.panels.${key}.body`),
    cta: t(`settings.panels.${key}.cta`),
  }))
);
</script>

<template>
  <main class="mx-auto flex w-full max-w-5xl flex-col gap-8 py-10">
    <header class="flex flex-col gap-2">
      <p class="section-heading">{{ t('settings.header.eyebrow') }}</p>
      <h1 class="text-3xl font-semibold">{{ t('settings.header.title') }}</h1>
      <p class="max-w-2xl text-sm text-white/60">
        {{ t('settings.header.body') }}
      </p>
    </header>

    <section class="grid gap-4 md:grid-cols-2">
      <article
        v-for="panel in panels"
        :key="panel.key"
        class="glass-panel flex flex-col gap-3 rounded-3xl p-6 transition hover:border-primary/30 hover:shadow-glow"
      >
        <h2 class="text-xl font-semibold">{{ panel.title }}</h2>
        <p class="text-sm text-white/60">{{ panel.copy }}</p>
        <button
          class="mt-auto inline-flex w-max items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:bg-white/10"
        >
          {{ panel.cta }}
        </button>
      </article>
    </section>
  </main>
</template>
