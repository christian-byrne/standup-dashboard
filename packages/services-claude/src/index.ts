export interface ClaudeServiceConfig {
  apiKey: string;
  model: string;
  apiUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface SummarizeInput {
  username: string;
  hours: number;
  rawBullets: string[];
  promptInstructions: string;
}

export interface ClaudeSummary {
  summaryBullets: string[];
  rawResponse: unknown;
}

const DEFAULT_API_URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeService {
  constructor(private readonly config: ClaudeServiceConfig) {
    if (!config.apiKey) {
      throw new Error('ClaudeService requires an API key.');
    }
  }

  async summarize(input: SummarizeInput): Promise<ClaudeSummary> {
    const body = buildRequestBody(this.config, input);

    const res = await fetch(this.config.apiUrl ?? DEFAULT_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': this.config.apiKey
      },
      body: JSON.stringify(body)
    });

    if (res.status === 429) {
      const retryAfter = Number.parseInt(res.headers.get('retry-after') ?? '60', 10) || 60;
      const error = new Error('Claude rate limit hit');
      (error as Error & { retryAfter?: number }).retryAfter = retryAfter;
      throw error;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Claude request failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { content?: Array<{ text?: string }>; [key: string]: unknown };
    const text = data.content?.map((chunk) => chunk.text ?? '').join('\n').trim() ?? '';
    const summaryBullets = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => (line.startsWith('-') ? line : `- ${line}`));

    return {
      summaryBullets: summaryBullets.length ? summaryBullets : ['- No notable updates to report.'],
      rawResponse: data
    } satisfies ClaudeSummary;
  }
}

function buildRequestBody(config: ClaudeServiceConfig, input: SummarizeInput) {
  const now = new Date().toISOString();
  const prompt = `${input.promptInstructions}\nCurrent date/time: ${now}\nGitHub username: ${input.username}\nLookback hours: ${input.hours}\nRaw entries:\n${input.rawBullets.join('\n')}`;

  return {
    model: config.model,
    max_tokens: config.maxTokens ?? 600,
    temperature: config.temperature ?? 0.4,
    system: 'You are an assistant that condenses GitHub pull request updates into crisp standup notes.',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };
}

export function createClaudeService(config: ClaudeServiceConfig) {
  return new ClaudeService(config);
}
