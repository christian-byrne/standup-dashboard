import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

const { createClaudeService } = await import('./index');

beforeEach(() => {
  fetchMock.mockReset();
});

describe('ClaudeService', () => {
  it('returns bullets from Claude response text', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        content: [
          { text: '- Bullet one' },
          { text: 'Bullet two without dash' }
        ]
      })
    });

    const service = createClaudeService({ apiKey: 'key', model: 'claude-test' });
    const summary = await service.summarize({
      username: 'foo',
      hours: 24,
      rawBullets: ['- raw'],
      promptInstructions: 'Do it'
    });

    expect(summary.summaryBullets).toEqual(['- Bullet one', '- Bullet two without dash']);
  });

  it('throws retryable error when Claude returns 429', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: (key: string) => (key === 'retry-after' ? '120' : null) },
      text: async () => 'rate limited'
    });

    const service = createClaudeService({ apiKey: 'key', model: 'claude-test' });
    await expect(
      service.summarize({ username: 'foo', hours: 24, rawBullets: [], promptInstructions: 'Do it' })
    ).rejects.toMatchObject({ retryAfter: 120 });
  });
});
