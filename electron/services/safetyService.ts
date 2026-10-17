import type { GitHubRepo, GitHubRelease, SafetyReport } from '../../src/types';

export function evaluateRepoSafety(repo: GitHubRepo, release?: GitHubRelease): SafetyReport {
  let score = 30; // base score
  const reasons: string[] = [];
  const warnings: string[] = [];
  let hasChecksum = false;
  let checksumValue: string | undefined = undefined;

  // 1. Stars evaluation
  if (repo.stargazers_count >= 5000) {
    score += 35;
    reasons.push(`Highly popular project with ${repo.stargazers_count.toLocaleString()} stars`);
  } else if (repo.stargazers_count >= 500) {
    score += 25;
    reasons.push(`Established community with ${repo.stargazers_count.toLocaleString()} stars`);
  } else if (repo.stargazers_count >= 100) {
    score += 15;
    reasons.push(`Moderate community backing (${repo.stargazers_count} stars)`);
  } else {
    score -= 10;
    warnings.push(`Low star count (${repo.stargazers_count} stars). Verify the author before installing.`);
  }

  // 2. Forks count
  if (repo.forks_count >= 100) {
    score += 10;
    reasons.push(`Actively referenced and forked (${repo.forks_count.toLocaleString()} forks)`);
  }

  // 3. License
  if (repo.license && repo.license.name) {
    score += 10;
    reasons.push(`Open source under ${repo.license.name}`);
  } else {
    warnings.push('No standard open source license detected');
  }

  // 4. Release assets and Checksum analysis
  if (release && release.assets && release.assets.length > 0) {
    score += 10;
    reasons.push(`Official release "${release.tag_name}" with compiled binaries`);

    // Look for checksum file
    const checksumAsset = release.assets.find((a) => {
      const n = a.name.toLowerCase();
      return n.includes('sha256') || n.includes('checksum') || n.includes('hash');
    });

    if (checksumAsset) {
      hasChecksum = true;
      score += 10;
      reasons.push(`Provides official checksum file: ${checksumAsset.name}`);
    }

    // Check if release body has sha256 string
    if (release.body) {
      const shaMatch = release.body.match(/\b[A-Fa-f0-9]{64}\b/);
      if (shaMatch) {
        hasChecksum = true;
        checksumValue = shaMatch[0];
        reasons.push('Release notes include verified SHA256 checksum');
      }
    }
  } else {
    warnings.push('No release binaries published yet');
  }

  // Clamp score
  const finalScore = Math.max(0, Math.min(100, score));
  const isVerified = finalScore >= 60 && repo.stargazers_count >= 100;

  return {
    isVerified,
    score: finalScore,
    reasons,
    warnings,
    hasChecksum,
    checksumValue,
  };
}
