import { describe, expect, it, vi } from 'vitest';

const issuesAndPullRequestsMock = vi.fn();

vi.mock('@octokit/rest', () => {
  class OctokitMock {
    rest = {
      search: {
        issuesAndPullRequests: issuesAndPullRequestsMock
      }
    };

    async paginate<T>(fn: () => Promise<T> | T) {
      return fn();
    }
  }

  return { Octokit: OctokitMock };
});

const { createGithubService } = await import('./index');

describe('GithubService', () => {
  it('merges and sorts PRs by updated date', async () => {
    issuesAndPullRequestsMock.mockResolvedValueOnce([
      {
        title: 'Merged PR',
        repository_url: 'https://api.github.com/repos/foo/bar',
        pull_request: { html_url: 'https://github.com/foo/bar/pull/1', merged_at: '2024-01-02T00:00:00Z' },
        html_url: 'https://github.com/foo/bar/pull/1',
        state: 'closed',
        updated_at: '2024-01-03T00:00:00Z',
        closed_at: '2024-01-02T00:00:00Z'
      }
    ]);

    issuesAndPullRequestsMock.mockResolvedValueOnce([
      {
        title: 'Open PR',
        repository_url: 'https://api.github.com/repos/foo/baz',
        pull_request: { html_url: 'https://github.com/foo/baz/pull/2', merged_at: null },
        html_url: 'https://github.com/foo/baz/pull/2',
        state: 'open',
        updated_at: '2024-01-04T00:00:00Z'
      },
      {
        title: 'Merged PR',
        repository_url: 'https://api.github.com/repos/foo/bar',
        pull_request: { html_url: 'https://github.com/foo/bar/pull/1', merged_at: '2024-01-02T00:00:00Z' },
        html_url: 'https://github.com/foo/bar/pull/1',
        state: 'closed',
        updated_at: '2024-01-03T00:00:00Z'
      }
    ]);

    const service = createGithubService({ token: 'fake-token' });
    const result = await service.searchRecentPullRequests({ username: 'foo', sinceISO: '2024-01-01T00:00:00Z' });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      title: 'Open PR',
      repository: 'foo/baz',
      state: 'open'
    });
    expect(result[1]).toMatchObject({
      title: 'Merged PR',
      repository: 'foo/bar',
      state: 'merged'
    });
  });
});
