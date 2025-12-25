import type { FastifyPluginAsync } from 'fastify';
import { listJobsHandler, listJobRunsHandler } from './handlers.js';

const jobsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/jobs/list → Databricks /api/2.2/jobs/list
  fastify.get('/list', listJobsHandler);

  // GET /api/v1/jobs/runs/list → Databricks /api/2.2/jobs/runs/list
  fastify.get('/runs/list', listJobRunsHandler);
};

export default jobsRoutes;
