import type { FastifyPluginAsync } from 'fastify';
import { extractRequestContext } from '../../../../utils/headers.js';
import * as githubService from '../../../../services/githubService.js';
import { isEncryptionAvailable } from '../../../../utils/encryption.js';

const githubRoutes: FastifyPluginAsync = async (fastify) => {
  // Check if GitHub PAT is set (returns boolean only, never the actual token)
  // GET /api/v1/oauth/github
  fastify.get('/', async (request, reply) => {
    let context;
    try {
      context = extractRequestContext(request);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }

    if (!isEncryptionAvailable()) {
      return { hasGithubPat: false, encryptionAvailable: false };
    }

    try {
      const hasGithubPat = await githubService.hasGithubPat(context.user.sub);
      return { hasGithubPat, encryptionAvailable: true };
    } catch (error: any) {
      console.error('Failed to check GitHub PAT status:', error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // Set GitHub PAT
  // POST /api/v1/oauth/github
  fastify.post<{ Body: { pat: string } }>('/', async (request, reply) => {
    let context;
    try {
      context = extractRequestContext(request);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }

    const { pat } = request.body;

    if (!pat || typeof pat !== 'string' || pat.trim().length === 0) {
      return reply.status(400).send({ error: 'GitHub PAT is required' });
    }

    if (!isEncryptionAvailable()) {
      return reply.status(503).send({
        error:
          'GitHub PAT storage is not available. ENCRYPTION_KEY not configured.',
      });
    }

    try {
      const result = await githubService.setGithubPatForUser(
        context.user,
        pat.trim()
      );
      return {
        success: true,
        login: result.login,
        name: result.name,
      };
    } catch (error: any) {
      console.error('Failed to set GitHub PAT:', error);
      // Return 400 for validation errors (invalid token)
      if (error.message.includes('Invalid GitHub token')) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  });

  // Clear GitHub PAT
  // DELETE /api/v1/oauth/github
  fastify.delete('/', async (request, reply) => {
    let context;
    try {
      context = extractRequestContext(request);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }

    try {
      await githubService.clearGithubPat(context.user.sub);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to clear GitHub PAT:', error);
      return reply.status(500).send({ error: error.message });
    }
  });
};

export default githubRoutes;
