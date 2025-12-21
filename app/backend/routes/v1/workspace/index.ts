import type { FastifyPluginAsync } from 'fastify';
import {
  listRootWorkspaceHandler,
  listUserWorkspaceHandler,
  listWorkspacePathHandler,
  createDirectoryHandler,
  getStatusHandler,
} from './handlers.js';

const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  // List root workspace (returns Users and Shared)
  // GET /api/v1/workspace
  fastify.get('/', listRootWorkspaceHandler);

  // Get workspace object status (including object_id and browse_url)
  // GET /api/v1/workspace/status?path=users/me/.claude
  // Must be registered before wildcard route
  fastify.get('/status', getStatusHandler);

  // List user's workspace directory (uses Service Principal token)
  // GET /api/v1/workspace/users/:email
  // Note: 'me' is resolved to actual email from header
  fastify.get('/users/:email', listUserWorkspaceHandler);

  // List any workspace path (uses Service Principal token)
  // GET /api/v1/workspace/*
  // Supports: /users/me/..., /users/:email/..., /shared/...
  fastify.get('/*', listWorkspacePathHandler);

  // Create a directory in workspace
  // POST /api/v1/workspace/*
  // Example: POST /api/v1/workspace/users/me/new-folder
  fastify.post('/*', createDirectoryHandler);
};

export default workspaceRoutes;
