import type { FastifyPluginAsync } from 'fastify';
import {
  createSessionHandler,
  listSessionsHandler,
  updateSessionHandler,
  archiveSessionHandler,
  getSessionEventsHandler,
} from './handlers.js';

const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  // Create session
  fastify.post('/', createSessionHandler);

  // List sessions
  fastify.get('/', listSessionsHandler);

  // Update session
  fastify.patch('/:sessionId', updateSessionHandler);

  // Archive session
  fastify.patch('/:sessionId/archive', archiveSessionHandler);

  // Get session events
  fastify.get('/:sessionId/events', getSessionEventsHandler);
};

export default sessionRoutes;
