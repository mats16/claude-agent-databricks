import type { FastifyPluginAsync } from 'fastify';
import {
  listPresetSkillsHandler,
  importPresetSkillHandler,
} from '../skills/handlers.js';
import {
  listPresetSubagentsHandler,
  importPresetSubagentHandler,
} from '../subagents/handlers.js';

const presetConfigRoutes: FastifyPluginAsync = async (fastify) => {
  // List all preset skills
  // GET /api/v1/preset-configs/claude/skills
  fastify.get('/claude/skills', listPresetSkillsHandler);

  // Import preset skill
  // POST /api/v1/preset-configs/claude/skills/:presetName/import
  fastify.post('/claude/skills/:presetName/import', importPresetSkillHandler);

  // List all preset subagents
  // GET /api/v1/preset-configs/claude/agents
  fastify.get('/claude/agents', listPresetSubagentsHandler);

  // Import preset subagent
  // POST /api/v1/preset-configs/claude/agents/:presetName/import
  fastify.post(
    '/claude/agents/:presetName/import',
    importPresetSubagentHandler
  );
};

export default presetConfigRoutes;
