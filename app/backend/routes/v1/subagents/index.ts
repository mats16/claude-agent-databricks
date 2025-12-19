import type { FastifyPluginAsync } from 'fastify';
import {
  listSubagentsHandler,
  getSubagentHandler,
  createSubagentHandler,
  updateSubagentHandler,
  deleteSubagentHandler,
} from './handlers.js';

const subagentRoutes: FastifyPluginAsync = async (fastify) => {
  // List all subagents
  fastify.get('/', listSubagentsHandler);

  // Get single subagent
  fastify.get('/:subagentName', getSubagentHandler);

  // Create new subagent
  fastify.post('/', createSubagentHandler);

  // Update existing subagent
  fastify.patch('/:subagentName', updateSubagentHandler);

  // Delete subagent
  fastify.delete('/:subagentName', deleteSubagentHandler);
};

export default subagentRoutes;
