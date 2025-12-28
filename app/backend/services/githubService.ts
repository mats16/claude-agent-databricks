import {
  getGithubPat,
  hasGithubPat as hasGithubPatInDb,
  setGithubPat as setGithubPatInDb,
  deleteGithubPat,
} from '../db/oauthTokens.js';
import { upsertUser } from '../db/users.js';
import { isEncryptionAvailable } from '../utils/encryption.js';
import type { RequestUser } from '../models/RequestUser.js';

// GitHub user info from /user API
interface GitHubUserInfo {
  login: string;
  name: string | null;
  avatar_url: string;
}

/**
 * Check if GitHub PAT is configured for user.
 */
export async function hasGithubPat(userId: string): Promise<boolean> {
  if (!isEncryptionAvailable()) return false;
  return hasGithubPatInDb(userId);
}

/**
 * Get decrypted GitHub PAT for agent use (internal only).
 * Uses Direct (non-RLS) query since user context is already verified by caller.
 * Returns undefined when not set.
 */
export async function getGithubPersonalAccessToken(
  userId: string
): Promise<string | undefined> {
  if (!isEncryptionAvailable()) return undefined;

  try {
    const pat = await getGithubPat(userId);
    return pat ?? undefined;
  } catch (error) {
    console.warn(
      `[GitHub PAT] Failed to decrypt PAT for user ${userId}. ` +
        'User should re-configure their GitHub PAT.',
      error instanceof Error ? error.message : error
    );
    return undefined;
  }
}

/**
 * Verify GitHub PAT by calling /user API.
 */
async function verifyGithubPat(
  pat: string
): Promise<{ valid: boolean; user?: GitHubUserInfo }> {
  try {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Claude-Agent-Databricks',
      },
    });

    if (!response.ok) {
      console.error(
        'GitHub PAT verification failed:',
        response.status,
        response.statusText
      );
      return { valid: false };
    }

    const user = (await response.json()) as GitHubUserInfo;
    return { valid: true, user };
  } catch (error) {
    console.error('Error verifying GitHub PAT:', error);
    return { valid: false };
  }
}

/**
 * Set GitHub PAT (verifies with GitHub API, stores encrypted).
 */
export async function setGithubPatForUser(
  user: RequestUser,
  pat: string
): Promise<{ login: string; name: string | null }> {
  if (!isEncryptionAvailable()) {
    throw new Error('Encryption not available. Cannot store GitHub PAT.');
  }

  // Verify PAT with GitHub API
  const { valid, user: githubUser } = await verifyGithubPat(pat);
  if (!valid || !githubUser) {
    throw new Error(
      'Invalid GitHub token. Please check your token and try again.'
    );
  }

  // Ensure user exists in database
  await upsertUser(user.sub, user.email);

  // Store PAT (encryption handled by customType)
  await setGithubPatInDb(user.sub, pat);

  console.log(
    `GitHub PAT configured for user ${user.sub} (GitHub: @${githubUser.login})`
  );

  return { login: githubUser.login, name: githubUser.name };
}

/**
 * Clear GitHub PAT.
 */
export async function clearGithubPat(userId: string): Promise<void> {
  await deleteGithubPat(userId);
}
