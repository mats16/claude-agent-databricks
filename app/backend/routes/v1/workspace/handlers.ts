import type { FastifyRequest, FastifyReply } from 'fastify';
import { extractRequestContext } from '../../../utils/headers.js';
import * as workspaceService from '../../../services/workspaceService.js';

// List root workspace (returns Users and Shared)
export async function listRootWorkspaceHandler(
  _request: FastifyRequest,
  _reply: FastifyReply
) {
  return workspaceService.getRootWorkspace();
}

// List user's workspace directory (uses Service Principal token)
export async function listUserWorkspaceHandler(
  request: FastifyRequest<{ Params: { email: string } }>,
  reply: FastifyReply
) {
  let email: string | undefined = request.params.email;

  // Resolve 'me' to actual email from header
  if (email === 'me') {
    try {
      const context = extractRequestContext(request);
      email = context.userEmail;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  }

  if (!email) {
    return reply.status(400).send({ error: 'Email required' });
  }

  try {
    const result = await workspaceService.listUserWorkspace(email);
    return result;
  } catch (error: any) {
    if (error instanceof workspaceService.WorkspaceError) {
      if (error.code === 'PERMISSION_DENIED') {
        return reply.status(403).send({ error: 'PERMISSION_DENIED' });
      }
      if (error.code === 'API_ERROR') {
        return reply.status(400).send({ error: error.message });
      }
    }
    return reply.status(500).send({ error: error.message });
  }
}

// Get workspace object status (includes object_id, uses Service Principal token)
export async function getWorkspaceStatusHandler(
  request: FastifyRequest<{ Body: { path: string } }>,
  reply: FastifyReply
) {
  const { path: workspacePath } = request.body;

  if (!workspacePath) {
    return reply.status(400).send({ error: 'path is required' });
  }

  try {
    const result = await workspaceService.getWorkspaceStatus(workspacePath);
    return result;
  } catch (error: any) {
    if (error instanceof workspaceService.WorkspaceError) {
      if (error.code === 'PERMISSION_DENIED') {
        return reply.status(403).send({ error: 'PERMISSION_DENIED' });
      }
      if (error.code === 'NOT_FOUND') {
        return reply.status(404).send({ error: error.message });
      }
    }
    return reply.status(500).send({ error: error.message });
  }
}

// List any workspace path (Shared, Repos, etc., uses Service Principal token)
export async function listWorkspacePathHandler(
  request: FastifyRequest<{ Params: { '*': string } }>,
  reply: FastifyReply
) {
  const subpath = request.params['*'];

  try {
    const result = await workspaceService.listWorkspacePath(subpath);
    return result;
  } catch (error: any) {
    if (error instanceof workspaceService.WorkspaceError) {
      if (error.code === 'PERMISSION_DENIED') {
        return reply.status(403).send({ error: 'PERMISSION_DENIED' });
      }
    }
    return reply.status(500).send({ error: error.message });
  }
}
