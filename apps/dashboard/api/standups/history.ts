import { VercelRequest, VercelResponse } from '@vercel/node';
import { loadConfig } from '@standup/config';
import { createFileStorage } from '@standup/storage-fs';

interface StandupRecord {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = loadConfig();
    const limit = Number(req.query.limit) || 14;
    
    const storage = createFileStorage({ 
      rootDir: config.storageDir || './standup-data' 
    });

    // Load records using the storage list method
    const items = await storage.list(limit);

    res.status(200).json({ 
      items,
      total: items.length,
      limit 
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}