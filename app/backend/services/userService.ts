import { getAccessToken } from '../agent/index.js';
import { databricks } from '../config/index.js';
import { getSettings, upsertSettings } from '../db/settings.js';
import { upsertUser } from '../db/users.js';

export interface UserInfo {
  userId: string;
  email: string | null;
  workspaceHome: string | null;
  hasWorkspacePermission: boolean;
  databricksAppUrl: string | null;
}

export interface UserSettings {
  userId: string;
  claudeConfigAutoPush: boolean;
}

// Ensure user exists in database
export async function ensureUser(
  userId: string,
  userEmail: string
): Promise<void> {
  await upsertUser(userId, userEmail);
}

// Check if user has workspace permission by attempting to create .claude directory
export async function checkWorkspacePermission(
  userEmail: string
): Promise<boolean> {
  const workspaceHome = `/Workspace/Users/${userEmail}`;
  const claudeConfigPath = `${workspaceHome}/.claude`;

  try {
    const token = await getAccessToken();
    const response = await fetch(
      `${databricks.hostUrl}/api/2.0/workspace/mkdirs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: claudeConfigPath }),
      }
    );

    const data = (await response.json()) as {
      error_code?: string;
      message?: string;
    };

    return !data.error_code;
  } catch (error: any) {
    console.error('Failed to check workspace permission:', error);
    return false;
  }
}

// Get user info including workspace permission check
export async function getUserInfo(
  userId: string,
  userEmail: string
): Promise<UserInfo> {
  // Ensure user exists
  await ensureUser(userId, userEmail);

  // Workspace home is derived from user email
  const workspaceHome = userEmail ? `/Workspace/Users/${userEmail}` : null;

  // Check workspace permission
  let hasWorkspacePermission = false;
  if (workspaceHome) {
    hasWorkspacePermission = await checkWorkspacePermission(userEmail);
  }

  // Build Databricks app URL
  const databricksAppUrl =
    databricks.appName && databricks.host
      ? `https://${databricks.host}/apps/${databricks.appName}`
      : null;

  return {
    userId,
    email: userEmail ?? null,
    workspaceHome,
    hasWorkspacePermission,
    databricksAppUrl,
  };
}

// Get user settings
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const userSettings = await getSettings(userId);

  if (!userSettings) {
    return { userId, claudeConfigAutoPush: true };
  }

  return {
    userId: userSettings.userId,
    claudeConfigAutoPush: userSettings.claudeConfigAutoPush,
  };
}

// Update user settings
export async function updateUserSettings(
  userId: string,
  userEmail: string,
  settings: { claudeConfigAutoPush?: boolean }
): Promise<void> {
  await ensureUser(userId, userEmail);
  await upsertSettings(userId, settings);
}
