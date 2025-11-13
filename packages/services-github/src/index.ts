import { Octokit } from '@octokit/rest';

export interface GithubServiceConfig {
  token?: string;
}

export interface SearchPullsParams {
  username: string;
  sinceISO: string;
}

export interface PullRequestSummary {
  title: string;
  repository: string;
  url: string;
  state: 'open' | 'closed' | 'merged';
  mergedAt?: string | null;
  updatedAt: string;
}

export class GithubService {
  private readonly octokit: Octokit;

  constructor(config: GithubServiceConfig = {}) {
    this.octokit = new Octokit(
      config.token
        ? {
            auth: config.token
          }
        : undefined
    );
  }

  async searchRecentPullRequests(params: SearchPullsParams): Promise<PullRequestSummary[]> {
    const { username, sinceISO } = params;

    const [merged, updated] = await Promise.all([
      this.paginatePulls(`is:pr author:${username} merged:>=${sinceISO} sort:updated-desc`),
      this.paginatePulls(`is:pr author:${username} updated:>=${sinceISO} sort:updated-desc`)
    ]);

    const map = new Map<string, PullRequestSummary>();
    const upsert = (item: PullRequestSummary) => map.set(item.url, item);

    merged.forEach(upsert);
    updated.forEach(upsert);

    return Array.from(map.values()).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  private async paginatePulls(query: string): Promise<PullRequestSummary[]> {
    const results = await this.octokit.paginate(this.octokit.rest.search.issuesAndPullRequests, {
      q: query,
      per_page: 50
    });

    return results
      .filter((item) => item.pull_request?.html_url)
      .map((item) => {
        const repository = item.repository_url?.split('/').slice(-2).join('/') ?? 'unknown';
        const url = item.pull_request?.html_url ?? item.html_url;
        const mergedAt = item.pull_request?.merged_at ?? null;
        const isMerged = Boolean(mergedAt);
        const state = isMerged ? 'merged' : (item.state as 'open' | 'closed');

        return {
          title: item.title,
          repository,
          url,
          state,
          mergedAt,
          updatedAt: item.updated_at ?? mergedAt ?? item.created_at ?? new Date().toISOString()
        } satisfies PullRequestSummary;
      });
  }
}

export function createGithubService(config: GithubServiceConfig = {}) {
  return new GithubService(config);
}
