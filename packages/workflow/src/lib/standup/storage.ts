import path from 'node:path';
import { createFileStorage, type StandupRecord } from '@standup/storage-fs';

function getStorageDir(): string {
  const base = process.env.STANDUP_STORAGE_DIR;
  if (base && base.trim().length > 0) {
    return base;
  }
  return path.join(process.cwd(), 'standup-data');
}

function getStorage() {
  return createFileStorage({ rootDir: getStorageDir() });
}

export async function readLatestStandup(): Promise<StandupRecord | null> {
  const storage = getStorage();
  return storage.readLatest();
}

export async function readStandupHistory(limit = 7): Promise<StandupRecord[]> {
  const storage = getStorage();
  return storage.list(limit);
}
