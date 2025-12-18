import type { FastifyPluginAsync } from 'fastify';
import {
  listRootWorkspaceHandler,
  listUserWorkspaceHandler,
  getWorkspaceStatusHandler,
  listWorkspacePathHandler,
} from './handlers.js';

const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  // List root workspace (returns Users and Shared)
  fastify.get('/', listRootWorkspaceHandler);

  // List user's workspace directory (uses Service Principal token)
  fastify.get('/Users/:email', listUserWorkspaceHandler);

  // Get workspace object status (includes object_id)
  fastify.post('/status', getWorkspaceStatusHandler);

  // List any workspace path (Shared, Repos, etc.)
  // Note: This must be registered last due to wildcard
  fastify.get('/*', listWorkspacePathHandler);
};

export default workspaceRoutes;
