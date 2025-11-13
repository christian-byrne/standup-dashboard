import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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

export interface SupabaseStorageConfig {
  url: string;
  anonKey: string;
  tableName?: string;
}

export interface SupabaseStandupRecord extends Omit<StandupRecord, 'generatedAt'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseStorage {
  private readonly client: SupabaseClient;
  private readonly tableName: string;

  constructor(config: SupabaseStorageConfig) {
    this.client = createClient(config.url, config.anonKey);
    this.tableName = config.tableName || 'standups';
  }

  async save(record: StandupRecord): Promise<void> {
    const supabaseRecord: SupabaseStandupRecord = {
      dateKey: record.dateKey,
      username: record.username,
      hours: record.hours,
      claudeModel: record.claudeModel,
      rawBullets: record.rawBullets,
      summaryBullets: record.summaryBullets,
      activity: record.activity,
      created_at: record.generatedAt,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await this.client
      .from(this.tableName)
      .upsert(supabaseRecord, {
        onConflict: 'date_key,username'
      });

    if (upsertError) {
      throw new Error(`Failed to save standup record: ${upsertError.message}`);
    }
  }

  async readLatest(): Promise<StandupRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw new Error(`Failed to read latest standup: ${error.message}`);
    }

    return this.transformSupabaseRecord(data);
  }

  async list(limit = 7): Promise<StandupRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list standups: ${error.message}`);
    }

    return (data || []).map(record => this.transformSupabaseRecord(record));
  }

  async readByDateKey(dateKey: string, username?: string): Promise<StandupRecord | null> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('date_key', dateKey);

    if (username) {
      query = query.eq('username', username);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to read standup by date: ${error.message}`);
    }

    return this.transformSupabaseRecord(data);
  }

  async delete(dateKey: string, username?: string): Promise<void> {
    let query = this.client
      .from(this.tableName)
      .delete()
      .eq('date_key', dateKey);

    if (username) {
      query = query.eq('username', username);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to delete standup: ${error.message}`);
    }
  }

  private transformSupabaseRecord(record: SupabaseStandupRecord): StandupRecord {
    return {
      generatedAt: record.created_at || new Date().toISOString(),
      dateKey: record.dateKey,
      username: record.username,
      hours: record.hours,
      claudeModel: record.claudeModel,
      rawBullets: record.rawBullets,
      summaryBullets: record.summaryBullets,
      activity: record.activity,
    };
  }
}

export function createSupabaseStorage(config: SupabaseStorageConfig): SupabaseStorage {
  return new SupabaseStorage(config);
}