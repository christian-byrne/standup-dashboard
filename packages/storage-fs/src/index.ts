import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface StandupRecord {
  generatedAt: string;
  dateKey: string;
  username: string;
  hours: number;
  claudeModel?: string;
  rawBullets: string[];
  summaryBullets: string[];
  activity: Array<{
    title: string;
    repository: string;
    url: string;
    state: 'open' | 'closed' | 'merged';
    mergedAt?: string | null;
    updatedAt: string;
  }>;
}

export interface FileStorageConfig {
  rootDir: string;
}

export class FileStorage {
  private readonly rootDir: string;

  constructor(config: FileStorageConfig) {
    this.rootDir = config.rootDir;
  }

  async save(record: StandupRecord) {
    await fs.mkdir(this.rootDir, { recursive: true });
    const serialized = JSON.stringify(record, null, 2);

    const datedFile = path.join(this.rootDir, `${record.dateKey}.json`);
    const latestFile = path.join(this.rootDir, 'latest.json');

    await fs.writeFile(datedFile, serialized, 'utf8');
    await fs.writeFile(latestFile, serialized, 'utf8');
  }

  async readLatest(): Promise<StandupRecord | null> {
    try {
      const content = await fs.readFile(path.join(this.rootDir, 'latest.json'), 'utf8');
      return JSON.parse(content) as StandupRecord;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async list(limit = 7): Promise<StandupRecord[]> {
    let files: string[] = [];
    try {
      files = await fs.readdir(this.rootDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }

    const dated = files
      .filter((file) => file.endsWith('.json') && file !== 'latest.json')
      .sort((a, b) => (a < b ? 1 : -1))
      .slice(0, limit);

    const results: StandupRecord[] = [];
    for (const file of dated) {
      const content = await fs.readFile(path.join(this.rootDir, file), 'utf8');
      results.push(JSON.parse(content) as StandupRecord);
    }
    return results;
  }
}

export function createFileStorage(config: FileStorageConfig) {
  return new FileStorage(config);
}
