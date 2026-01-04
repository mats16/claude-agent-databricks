import path from 'path';
import fs from 'fs';
import type { User } from '../models/User.js';
import { getUsernameFromEmail } from '../models/User.js';

/**
 * Get user's local home directory.
 *
 * @param user - User object
 * @param home - Home directory from config (config.HOME)
 * @param userDirBase - User directory base from config (config.USER_DIR_BASE)
 * @returns Local home directory path: {home}/{userDirBase}/{username}
 */
export function getLocalHomeDir(
  user: User,
  home: string,
  userDirBase: string
): string {
  const username = getUsernameFromEmail(user.email);
  return path.join(home, userDirBase, username);
}

/**
 * Get user's local Claude config directory.
 *
 * @param user - User object
 * @param home - Home directory from config (config.HOME)
 * @param userDirBase - User directory base from config (config.USER_DIR_BASE)
 * @returns Local Claude config path: {home}/{userDirBase}/{username}/.claude
 */
export function getLocalClaudeConfigDir(
  user: User,
  home: string,
  userDirBase: string
): string {
  return path.join(getLocalHomeDir(user, home, userDirBase), '.claude');
}

/**
 * Get user's local skills directory.
 *
 * @param user - User object
 * @param home - Home directory from config (config.HOME)
 * @param userDirBase - User directory base from config (config.USER_DIR_BASE)
 * @returns Local skills path: {home}/{userDirBase}/{username}/.claude/skills
 */
export function getLocalSkillsPath(
  user: User,
  home: string,
  userDirBase: string
): string {
  return path.join(getLocalClaudeConfigDir(user, home, userDirBase), 'skills');
}

/**
 * Get user's local agents directory.
 *
 * @param user - User object
 * @param home - Home directory from config (config.HOME)
 * @param userDirBase - User directory base from config (config.USER_DIR_BASE)
 * @returns Local agents path: {home}/{userDirBase}/{username}/.claude/agents
 */
export function getLocalAgentsPath(
  user: User,
  home: string,
  userDirBase: string
): string {
  return path.join(getLocalClaudeConfigDir(user, home, userDirBase), 'agents');
}

/**
 * Get user's remote home directory (Databricks Workspace).
 *
 * @param user - User object
 * @returns Remote home path: /Workspace/Users/{email}
 */
export function getRemoteHomeDir(user: User): string {
  return path.join('/Workspace/Users', user.email);
}

/**
 * Get user's remote Claude config directory (Databricks Workspace).
 *
 * @param user - User object
 * @returns Remote Claude config path: /Workspace/Users/{email}/.claude
 */
export function getRemoteClaudeConfigDir(user: User): string {
  return path.join(getRemoteHomeDir(user), '.claude');
}

/**
 * Get user's remote skills directory (Databricks Workspace).
 *
 * @param user - User object
 * @returns Remote skills path: /Workspace/Users/{email}/.claude/skills
 */
export function getRemoteSkillsPath(user: User): string {
  return path.join(getRemoteClaudeConfigDir(user), 'skills');
}

/**
 * Get user's remote agents directory (Databricks Workspace).
 *
 * @param user - User object
 * @returns Remote agents path: /Workspace/Users/{email}/.claude/agents
 */
export function getRemoteAgentsPath(user: User): string {
  return path.join(getRemoteClaudeConfigDir(user), 'agents');
}

/**
 * Ensure user's local directory structure exists.
 * Creates skills and agents directories with all parent directories.
 *
 * @param user - User object
 * @param home - Home directory from config (config.HOME)
 * @param userDirBase - User directory base from config (config.USER_DIR_BASE)
 */
export function ensureUserLocalDirectories(
  user: User,
  home: string,
  userDirBase: string
): void {
  const skillsPath = getLocalSkillsPath(user, home, userDirBase);
  const agentsPath = getLocalAgentsPath(user, home, userDirBase);
  fs.mkdirSync(skillsPath, { recursive: true });
  fs.mkdirSync(agentsPath, { recursive: true });
}
