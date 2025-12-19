import type { FastifyPluginAsync } from 'fastify';
import {
  listRootWorkspaceHandler,
  listUserWorkspaceHandler,
  listWorkspacePathHandler,
} from './handlers.js';

const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  // List root workspace (returns Users and Shared)
  // GET /api/v1/workspace
  fastify.get('/', listRootWorkspaceHandler);

  // List user's workspace directory (uses Service Principal token)
  // GET /api/v1/workspace/users/:email
  // Note: 'me' is resolved to actual email from header
  fastify.get('/users/:email', listUserWorkspaceHandler);

  // List any workspace path (uses Service Principal token)
  // GET /api/v1/workspace/*
  // Supports: /users/me/..., /users/:email/..., /shared/...
  // Note: This must be registered last due to wildcard
  fastify.get('/*', listWorkspacePathHandler);
};

export default workspaceRoutes;
