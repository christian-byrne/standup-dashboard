<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useClipboard } from '../composables/useClipboard';

type DocsField = {
  key: string;
  type: string;
  optional: boolean;
  default?: unknown;
  notes?: string;
};

type DocsPayload = {
  generatedAt?: string;
  description?: string;
  fields?: DocsField[];
};

type DocsState = {
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'error';
  doc: DocsPayload | null;
  error: string | null;
};

const { t, locale } = useI18n();
const clipboard = useClipboard();

const state = reactive<DocsState>({
  status: 'idle',
  doc: null,
  error: null,
});

const loadDocs = async () => {
  if (state.status === 'loading') return;
  state.status = 'loading';
  state.error = null;

  try {
    const res = await fetch('/api/docs/reference/standup-config.schema.json', {
      headers: { accept: 'application/json' },
    });

    if (res.status === 404) {
      state.status = 'empty';
      state.doc = null;
      return;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to load docs (${res.status}): ${text}`);
    }

    state.doc = (await res.json()) as DocsPayload;
    state.status = state.doc?.fields?.length ? 'ready' : 'empty';
  } catch (error) {
    state.status = 'error';
    state.error = (error as Error).message;
  }
};

onMounted(() => {
  loadDocs();
});

const sectionKeys = ['api', 'contracts', 'architecture'] as const;

const sections = computed(() =>
  sectionKeys.map((key) => ({
    key,
    title: t(`docs.sections.${key}.title`),
    detail: t(`docs.sections.${key}.detail`),
  }))
);

const fields = computed(() => state.doc?.fields ?? []);
const generatedAt = computed(() =>
  state.doc?.generatedAt ? new Date(state.doc.generatedAt) : null
);
const formattedGeneratedAt = computed(() =>
  generatedAt.value
    ? new Intl.DateTimeFormat(locale.value, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(generatedAt.value)
    : null
);

const copyEnvTemplate = () => {
  const template = fields.value
    .map(field => {
      const comment = field.notes ? ` # ${field.notes}` : '';
      const defaultValue = field.default !== undefined ? `=${field.default}` : '=';
      return `${field.key}${defaultValue}${comment}`;
    })
    .join('\n');
  
  clipboard.copy(template);
};
</script>

<template>
  <main class="mx-auto flex w-full max-w-4xl flex-col gap-8 py-10">
    <header class="flex flex-col gap-2">
      <p class="section-heading">{{ t('docs.header.eyebrow') }}</p>
      <h1 class="text-3xl font-semibold">{{ t('docs.header.title') }}</h1>
      <p class="text-sm text-white/60">
        {{ t('docs.header.body') }}
      </p>
    </header>

    <section class="flex flex-col gap-4">
      <article
        v-for="section in sections"
        :key="section.key"
        class="glass-panel rounded-3xl border border-white/10 p-6"
      >
        <h2 class="text-xl font-semibold text-primary">{{ section.title }}</h2>
        <p class="text-sm text-white/60">{{ section.detail }}</p>
      </article>
    </section>

    <section class="glass-panel flex flex-col gap-4 rounded-3xl border border-white/10 p-6">
      <header class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="text-xl font-semibold text-primary">
            {{ t('docs.table.title') }}
          </h2>
          <p class="text-xs uppercase tracking-[0.3em] text-white/40">
            {{ formattedGeneratedAt ?? t('docs.table.generatedUnknown') }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="fields.length"
            class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="clipboard.isCopying()"
            @click="copyEnvTemplate"
          >
            <span v-if="clipboard.isSuccess()" class="text-emerald-400">✓</span>
            <span v-else-if="clipboard.isError()" class="text-rose-400">✗</span>
            <span v-else>📋</span>
            {{ clipboard.isSuccess() ? 'Copied!' : 'Copy .env' }}
          </button>
          <button
            class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:bg-white/10"
            @click="loadDocs()"
          >
            {{ t('docs.table.refresh') }}
          </button>
        </div>
      </header>

      <p v-if="state.status === 'loading'" class="text-sm text-white/60">
        {{ t('status.loading') }}
      </p>
      <p v-else-if="state.status === 'error'" class="text-sm text-rose-300">
        {{ t('status.error') }} — {{ state.error }}
      </p>
      <p v-else-if="state.status === 'empty'" class="text-sm text-white/60">
        {{ t('docs.table.empty') }}
      </p>
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm text-white/70">
          <thead>
            <tr class="border-b border-white/10 text-xs uppercase tracking-[0.3em] text-white/40">
              <th class="px-4 py-3">{{ t('docs.table.columns.name') }}</th>
              <th class="px-4 py-3">{{ t('docs.table.columns.type') }}</th>
              <th class="px-4 py-3">{{ t('docs.table.columns.optional') }}</th>
              <th class="px-4 py-3">{{ t('docs.table.columns.default') }}</th>
              <th class="px-4 py-3">{{ t('docs.table.columns.notes') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="field in fields"
              :key="field.key"
              class="border-b border-white/5 last:border-none"
            >
              <td class="px-4 py-3 font-mono text-white/80">{{ field.key }}</td>
              <td class="px-4 py-3 text-white/60">{{ field.type }}</td>
              <td class="px-4 py-3 text-white/60">
                {{ field.optional ? t('docs.table.boolean.yes') : t('docs.table.boolean.no') }}
              </td>
              <td class="px-4 py-3 text-white/60">
                <span v-if="typeof field.default !== 'undefined'">{{ field.default }}</span>
                <span v-else class="text-white/30">—</span>
              </td>
              <td class="px-4 py-3 text-white/60">
                <span v-if="field.notes">{{ field.notes }}</span>
                <span v-else class="text-white/30">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
