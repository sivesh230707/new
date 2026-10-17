import type { GitHubRepo, GitHubRelease } from '../../src/types';

export class GitHubService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'GitHub-Installer-Desktop-App',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token && token.trim()) {
      headers['Authorization'] = `token ${token.trim()}`;
    }
    return headers;
  }

  async searchRepos(query: string, page = 1, token?: string): Promise<{ items: GitHubRepo[]; total: number }> {
    let q = query.trim();

    // If query is a full GitHub URL (paste-a-link feature), handle gracefully
    const urlMatch = q.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (urlMatch) {
      const owner = urlMatch[1];
      const repo = urlMatch[2].replace(/\.git$/, '');
      try {
        const directRepo = await this.getRepo(owner, repo, token);
        return { items: [directRepo], total: 1 };
      } catch {
        // Fall back to standard search query
        q = `repo:${owner}/${repo}`;
      }
    }

    if (!q) {
      // Default curated popular apps query
      q = 'stars:>5000 archived:false (topic:desktop-app OR topic:windows OR topic:tools OR topic:utility)';
    }

    const cacheKey = `search:${q}:${page}`;
    const cached = this.getCached<{ items: GitHubRepo[]; total: number }>(cacheKey);
    if (cached) return cached;

    const encodedQuery = encodeURIComponent(q);
    const url = `https://api.github.com/search/repositories?q=${encodedQuery}&sort=stars&order=desc&per_page=24&page=${page}`;

    const res = await fetch(url, { headers: this.getHeaders(token) });
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('GitHub API rate limit exceeded. You can add a personal token in Settings to raise limits.');
      }
      throw new Error(`GitHub search failed: ${res.statusText}`);
    }

    const data = await res.json();
    const result = {
      items: data.items || [],
      total: Math.min(data.total_count || 0, 1000),
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getRepo(owner: string, repo: string, token?: string): Promise<GitHubRepo> {
    const cacheKey = `repo:${owner}/${repo}`;
    const cached = this.getCached<GitHubRepo>(cacheKey);
    if (cached) return cached;

    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const res = await fetch(url, { headers: this.getHeaders(token) });
    if (!res.ok) {
      if (res.status === 404) throw new Error(`Repository "${owner}/${repo}" was not found.`);
      if (res.status === 403) throw new Error('GitHub API rate limit exceeded.');
      throw new Error(`Failed to load repository details: ${res.statusText}`);
    }

    const data = (await res.json()) as GitHubRepo;
    this.setCache(cacheKey, data);
    return data;
  }

  async getReleases(owner: string, repo: string, token?: string): Promise<GitHubRelease[]> {
    const cacheKey = `releases:${owner}/${repo}`;
    const cached = this.getCached<GitHubRelease[]>(cacheKey);
    if (cached) return cached;

    const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=15`;
    const res = await fetch(url, { headers: this.getHeaders(token) });
    if (!res.ok) {
      if (res.status === 404) return [];
      if (res.status === 403) throw new Error('GitHub API rate limit reached.');
      throw new Error(`Failed to load releases: ${res.statusText}`);
    }

    const data = (await res.json()) as GitHubRelease[];
    this.setCache(cacheKey, data);
    return data;
  }

  async getReadme(owner: string, repo: string, token?: string): Promise<string> {
    const cacheKey = `readme:${owner}/${repo}`;
    const cached = this.getCached<string>(cacheKey);
    if (cached) return cached;

    const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
    const res = await fetch(url, {
      headers: {
        ...this.getHeaders(token),
        Accept: 'application/vnd.github.raw+json',
      },
    });

    if (!res.ok) {
      return '# No README found\nThis project does not have a public README document.';
    }

    const text = await res.text();
    this.setCache(cacheKey, text);
    return text;
  }
}
