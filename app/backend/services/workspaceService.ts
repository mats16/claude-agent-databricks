import { getAccessToken, databricksHost } from '../agent/index.js';

export interface WorkspaceObject {
  path: string;
  object_type: string;
}

export interface WorkspaceListResult {
  objects: WorkspaceObject[];
}

export interface WorkspaceStatusResult {
  path: string;
  object_type: string;
  object_id: number | null;
  browse_url: string | null;
}

export class WorkspaceError extends Error {
  constructor(
    message: string,
    public readonly code: 'PERMISSION_DENIED' | 'NOT_FOUND' | 'API_ERROR'
  ) {
    super(message);
    this.name = 'WorkspaceError';
  }
}

// Get root workspace directories
export function getRootWorkspace(): WorkspaceListResult {
  return {
    objects: [
      { path: '/Workspace/Users', object_type: 'DIRECTORY' },
      { path: '/Workspace/Shared', object_type: 'DIRECTORY' },
    ],
  };
}

// List workspace directory contents
export async function listWorkspace(
  workspacePath: string
): Promise<WorkspaceListResult> {
  const token = await getAccessToken();
  const response = await fetch(
    `${databricksHost}/api/2.0/workspace/list?path=${encodeURIComponent(workspacePath)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = (await response.json()) as {
    objects?: Array<{ path: string; object_type: string }>;
    error_code?: string;
    message?: string;
  };

  // Check for permission error - empty response {} also means no permission
  if (data.error_code === 'PERMISSION_DENIED' || !('objects' in data)) {
    throw new WorkspaceError('Permission denied', 'PERMISSION_DENIED');
  }

  // Check for other API errors
  if (data.error_code) {
    throw new WorkspaceError(data.message || 'API error', 'API_ERROR');
  }

  // Filter to only return directories
  const directories = data.objects?.filter(
    (obj) => obj.object_type === 'DIRECTORY'
  );

  return { objects: directories || [] };
}

// List user's workspace directory
export async function listUserWorkspace(
  email: string
): Promise<WorkspaceListResult> {
  const workspacePath = `/Workspace/Users/${email}`;
  return listWorkspace(workspacePath);
}

// Get workspace object status (includes object_id for browse URL)
export async function getWorkspaceStatus(
  workspacePath: string
): Promise<WorkspaceStatusResult> {
  const token = await getAccessToken();
  const response = await fetch(
    `${databricksHost}/api/2.0/workspace/get-status?path=${encodeURIComponent(workspacePath)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = (await response.json()) as {
    path?: string;
    object_type?: string;
    object_id?: number;
    error_code?: string;
    message?: string;
  };

  // Check for permission error
  if (data.error_code === 'PERMISSION_DENIED') {
    throw new WorkspaceError('Permission denied', 'PERMISSION_DENIED');
  }

  if (data.error_code) {
    throw new WorkspaceError(data.message || 'Not found', 'NOT_FOUND');
  }

  // Build browse URL for Databricks console
  const host = process.env.DATABRICKS_HOST;
  const browseUrl = data.object_id
    ? `https://${host}/browse/folders/${data.object_id}`
    : null;

  return {
    path: data.path || workspacePath,
    object_type: data.object_type || 'UNKNOWN',
    object_id: data.object_id || null,
    browse_url: browseUrl,
  };
}

// List any workspace path (Shared, Repos, etc.)
export async function listWorkspacePath(
  subpath: string
): Promise<WorkspaceListResult> {
  const wsPath = `/Workspace/${subpath}`;
  return listWorkspace(wsPath);
}
