import path from 'path';
import { getOidcAccessToken } from '../agent/index.js';
import {
  workspacePull,
  workspacePush,
  ensureWorkspaceDirectory,
} from '../utils/databricks.js';

// Get base path for user's local storage
function getLocalBasePath(): string {
  return path.join(process.env.HOME ?? '/tmp', 'u');
}

// Get local claude config path for a user
function getLocalClaudeConfigPath(userEmail: string): string {
  return path.join(getLocalBasePath(), userEmail, '.claude');
}

// Get workspace claude config path for a user
function getWorkspaceClaudeConfigPath(userEmail: string): string {
  return `/Workspace/Users/${userEmail}/.claude`;
}

// Pull (restore) claude config from workspace to local
export async function pullClaudeConfig(userEmail: string): Promise<void> {
  const localClaudeConfigPath = getLocalClaudeConfigPath(userEmail);
  const workspaceClaudeConfigPath = getWorkspaceClaudeConfigPath(userEmail);

  const spAccessToken = await getOidcAccessToken();

  console.log(
    `[Backup Pull] Pulling claude config from ${workspaceClaudeConfigPath} to ${localClaudeConfigPath}...`
  );

  await workspacePull(
    workspaceClaudeConfigPath,
    localClaudeConfigPath,
    true, // overwrite
    spAccessToken
  );

  console.log('[Backup Pull] Claude config pull completed');
}

// Push (backup) claude config from local to workspace
export async function pushClaudeConfig(userEmail: string): Promise<void> {
  const localClaudeConfigPath = getLocalClaudeConfigPath(userEmail);
  const workspaceClaudeConfigPath = getWorkspaceClaudeConfigPath(userEmail);

  const spAccessToken = await getOidcAccessToken();

  // Ensure workspace directory exists
  await ensureWorkspaceDirectory(workspaceClaudeConfigPath, spAccessToken);

  console.log(
    `[Backup Push] Pushing claude config from ${localClaudeConfigPath} to ${workspaceClaudeConfigPath}...`
  );

  await workspacePush(
    localClaudeConfigPath,
    workspaceClaudeConfigPath,
    spAccessToken,
    true // full sync
  );

  console.log('[Backup Push] Claude config push completed');
}

// Manual pull for /me/claude-config/pull endpoint (uses different path calculation for production)
export async function manualPullClaudeConfig(userEmail: string): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const homeBase = isProduction
    ? '/home/app/u'
    : path.join(process.env.HOME ?? '/tmp', 'u');
  const localClaudeConfigPath = path.join(homeBase, userEmail, '.claude');
  const workspaceClaudeConfigPath = getWorkspaceClaudeConfigPath(userEmail);

  const spAccessToken = await getOidcAccessToken();

  console.log(
    `[Manual Pull] Pulling claude config from ${workspaceClaudeConfigPath} to ${localClaudeConfigPath}...`
  );

  await workspacePull(
    workspaceClaudeConfigPath,
    localClaudeConfigPath,
    true, // overwrite
    spAccessToken
  );

  console.log('[Manual Pull] Claude config pull completed');
}
