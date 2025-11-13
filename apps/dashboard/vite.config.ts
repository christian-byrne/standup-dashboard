/// <reference types='vitest' />
import { Buffer } from 'node:buffer';
import { promises as fs } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type PluginOption } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

const require = createRequire(import.meta.url);
const mutableCrypto = require('node:crypto');

const ensureHash = (target: { hash?: unknown }) => {
  if (typeof target.hash !== 'function') {
    Object.assign(target, {
      hash: (algorithm: string, data: string | Buffer, encoding: BufferEncoding = 'hex') => {
        const hash = createHash(algorithm);
        hash.update(typeof data === 'string' ? data : Buffer.from(data));
        return hash.digest(encoding);
      },
    });
  }
};

if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error assigning node webcrypto to global scope
  globalThis.crypto = webcrypto;
}

ensureHash(globalThis.crypto as { hash?: unknown });
ensureHash(mutableCrypto);

const resolveStorageDir = () =>
  process.env.STANDUP_STORAGE_DIR && process.env.STANDUP_STORAGE_DIR.trim().length > 0
    ? process.env.STANDUP_STORAGE_DIR
    : path.join(process.cwd(), 'standup-data');

const readJson = async (filePath: string) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const readLatestStandup = async (): Promise<StandupJsonRecord | null> => {
  try {
    return (await readJson(path.join(resolveStorageDir(), 'latest.json'))) as StandupJsonRecord;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const readStandupHistory = async (limit: number): Promise<StandupJsonRecord[]> => {
  try {
    const dir = resolveStorageDir();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const dated = entries
      .filter(
        (entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'latest.json'
      )
      .map((entry) => entry.name)
      .sort((a, b) => (a < b ? 1 : -1))
      .slice(0, limit);

    const records: StandupJsonRecord[] = [];
    for (const file of dated) {
      records.push((await readJson(path.join(dir, file))) as StandupJsonRecord);
    }
    return records;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

type MiddlewareNext = (error?: unknown) => void;
type MiddlewareHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: MiddlewareNext
) => void | Promise<void>;
type MiddlewareApp = {
  use: (...args: [string, MiddlewareHandler] | [MiddlewareHandler]) => void;
};

const readStandupByDate = async (dateKey: string): Promise<StandupJsonRecord | null> => {
  try {
    return (await readJson(path.join(resolveStorageDir(), `${dateKey}.json`))) as StandupJsonRecord;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const readDocsReference = async () => {
  try {
    return await readJson(path.join(process.cwd(), 'docs/reference/standup-config.schema.json'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

type StandupJsonRecord = {
  generatedAt?: string;
  dateKey?: string;
  username?: string;
  hours?: number;
  claudeModel?: string;
  summaryBullets?: unknown;
  rawBullets?: unknown;
};

const toMarkdown = (record: StandupJsonRecord) => {
  const bullets = Array.isArray(record.summaryBullets) ? (record.summaryBullets as string[]) : [];
  const rawBullets = Array.isArray(record.rawBullets) ? (record.rawBullets as string[]) : [];

  const lines = [
    `# Standup for ${record.dateKey ?? record.generatedAt?.slice(0, 10) ?? 'Unknown Date'}`,
    '',
    `Generated: ${record.generatedAt ?? 'N/A'}`,
    `User: ${record.username ?? 'unknown'}`,
    `Lookback Hours: ${record.hours ?? 'N/A'}`,
    `Claude Model: ${record.claudeModel ?? 'unknown'}`,
    '',
    '## Summary Bullets',
    bullets.length ? bullets.join('\n') : '_No summary bullets available._',
    '',
    '## Raw Bullets',
    rawBullets.length ? rawBullets.join('\n') : '_No raw bullets captured._',
  ];

  return lines.join('\n');
};

const registerStandupRoutes = (app: MiddlewareApp) => {
  const handler: MiddlewareHandler = async (req, res, next) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    if (!url.pathname.startsWith('/api/standups') && !url.pathname.startsWith('/api/docs')) {
      return next();
    }

    if (url.pathname === '/api/standups/latest') {
      try {
        const latest = await readLatestStandup();
        if (!latest) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'No standup records found. Run `pnpm standup:run`.' }));
          return;
        }
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(latest));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: (error as Error).message }));
      }
      return;
    }

    if (url.pathname === '/api/standups/history') {
      try {
        const limitParam = url.searchParams.get('limit');
        const limit = limitParam ? Number.parseInt(limitParam, 10) || 14 : 14;
        const history = await readStandupHistory(limit);
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ items: history }));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: (error as Error).message }));
      }
      return;
    }

    if (url.pathname === '/api/docs/reference/standup-config.schema.json') {
      try {
        const doc = await readDocsReference();
        if (!doc) {
          res.statusCode = 404;
          res.end(
            JSON.stringify({ error: 'Documentation not generated yet. Run `pnpm docs:generate`.' })
          );
          return;
        }
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(doc, null, 2));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: (error as Error).message }));
      }
      return;
    }

    if (url.pathname.endsWith('.json')) {
      try {
        const dateKey = url.pathname.split('/').pop()?.replace('.json', '') ?? '';
        const record = await readStandupByDate(dateKey);
        if (!record) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `No standup found for ${dateKey}` }));
          return;
        }
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(record, null, 2));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: (error as Error).message }));
      }
      return;
    }

    if (url.pathname.endsWith('.md')) {
      try {
        const dateKey = url.pathname.split('/').pop()?.replace('.md', '') ?? '';
        const record = await readStandupByDate(dateKey);
        if (!record) {
          res.statusCode = 404;
          res.end(`No standup found for ${dateKey}`);
          return;
        }
        res.setHeader('content-type', 'text/markdown; charset=utf-8');
        res.end(toMarkdown(record));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: (error as Error).message }));
      }
      return;
    }

    next();
  };

  app.use(handler);
};

const standupApiPlugin = (): PluginOption => ({
  name: 'standup-api-middleware',
  configureServer(server) {
    registerStandupRoutes(server.middlewares);
  },
  configurePreviewServer(server) {
    registerStandupRoutes(server.middlewares);
  },
});

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/dashboard',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [vue(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md']), standupApiPlugin()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../../dist/apps/dashboard',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'dashboard',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/dashboard',
      provider: 'v8' as const,
    },
  },
}));
