import { VercelRequest, VercelResponse } from '@vercel/node';
import { loadConfig } from '@standup/config';
import { createGithubService } from '@standup/services-github';
import { createClaudeService } from '@standup/services-claude';
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
    
    if (!config.githubUsername) {
      return res.status(500).json({ error: 'Missing STANDUP_GITHUB_USERNAME configuration' });
    }

    if (!config.githubToken) {
      return res.status(500).json({ error: 'Missing GITHUB_TOKEN configuration' });
    }

    // Try to load from storage first
    const storage = createFileStorage({ 
      rootDir: config.storageDir || './standup-data' 
    });
    
    try {
      const existingRecord = await storage.readLatest();
      if (existingRecord) {
        return res.status(200).json(existingRecord);
      }
    } catch (error) {
      // Record doesn't exist, continue to generate new one
    }

    // Generate fresh standup data
    const githubService = createGithubService({ token: config.githubToken });
    
    const now = new Date();
    const sinceISO = new Date(now.getTime() - config.lookbackHours * 60 * 60 * 1000).toISOString();
    
    const activity = await githubService.searchRecentPullRequests({
      username: config.githubUsername,
      sinceISO
    });

    const rawBullets = activity.map(item => 
      `- :pr-${item.state}: ${item.title} [${item.repository}] (${item.url})`
    );

    let summaryBullets: string[] = [];
    let claudeModel = 'claude-3-5-sonnet';

    // Generate AI summary if Claude API key is available
    if (config.anthropicApiKey && rawBullets.length > 0) {
      try {
        const claudeService = createClaudeService({
          apiKey: config.anthropicApiKey,
          model: config.anthropicModel || 'claude-3-5-sonnet-20241022'
        });

        const promptInstructions = `Write exactly 2-4 bullet points about the development work below. Focus on ACTUAL functionality built, not vague themes.

CRITICAL: Start immediately with bullet points. No introduction, headers, or explanations.

Extract the real functionality from PR titles. Be specific about what was actually implemented:

Good examples:
❌ "Improved frontend UX with navigation fixes" (too vague)
✅ "Added tab restoration when closing current tab"

❌ "Enhanced testing infrastructure" (what was enhanced?)  
✅ "Added cloud E2E testing with automated CI checks"

❌ "Optimized telemetry" (how?)
✅ "Reduced telemetry heartbeat from 30sec to 5min intervals"

Rules:
- Capture the SPECIFIC feature/fix implemented
- 8-15 words per bullet
- Group only truly identical work (like "disable telemetry" across repos)
- Use concrete action verbs: Added, Fixed, Reduced, Enabled, Built
- If no meaningful work: "No notable development work"

Focus on what users/systems can now DO differently.`;

        const summary = await claudeService.summarize({
          username: config.githubUsername,
          hours: config.lookbackHours,
          rawBullets,
          promptInstructions
        });

        summaryBullets = summary.summaryBullets;
        claudeModel = config.anthropicModel || 'claude-3-5-sonnet';
      } catch (error) {
        console.error('Claude summarization failed:', error);
        // Fallback to raw bullets
        summaryBullets = rawBullets.slice(0, 5);
      }
    } else {
      // No AI key or no activity, use raw bullets
      summaryBullets = rawBullets.slice(0, 5);
    }

    const record: StandupRecord = {
      generatedAt: now.toISOString(),
      dateKey: today,
      username: config.githubUsername,
      hours: config.lookbackHours,
      claudeModel,
      rawBullets,
      summaryBullets: summaryBullets.length > 0 ? summaryBullets : ['- No notable updates to report.'],
      activity
    };

    // Save to storage
    try {
      await storage.save(record);
    } catch (error) {
      console.error('Failed to save record to storage:', error);
      // Continue without saving
    }

    res.status(200).json(record);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}