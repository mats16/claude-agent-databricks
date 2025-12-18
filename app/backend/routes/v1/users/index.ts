import type { FastifyPluginAsync } from 'fastify';
import { extractRequestContext } from '../../../utils/headers.js';
import * as userService from '../../../services/userService.js';
import * as claudeBackupService from '../../../services/claudeBackupService.js';

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current user info (includes workspace permission check)
  fastify.get('/me', async (request, reply) => {
    let context;
    try {
      context = extractRequestContext(request);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }

    const { userId, userEmail } = context;

    try {
      const userInfo = await userService.getUserInfo(userId, userEmail);
      return userInfo;
    } catch (error: any) {
      console.error('Failed to get user info:', error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // Get current user settings
  fastify.get('/me/settings', async (request, reply) => {
    let context;
    try {
      context = extractRequestContext(request);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }

    try {
      const settings = await userService.getUserSettings(context.userId);
      return settings;
    } catch (error: any) {
      console.error('Failed to get user settings:', error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // Update current user settings
  fastify.patch<{ Body: { claudeConfigSync?: boolean } }>(
    '/me/settings',
    async (request, reply) => {
      let context;
      try {
        context = extractRequestContext(request);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }

      const { claudeConfigSync } = request.body;

      if (claudeConfigSync === undefined) {
        return reply
          .status(400)
          .send({ error: 'claudeConfigSync is required' });
      }

      try {
        await userService.updateUserSettings(
          context.userId,
          context.userEmail,
          { claudeConfigSync }
        );
        return { success: true };
      } catch (error: any) {
        console.error('Failed to update user settings:', error);
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  // Pull claude config from workspace (manual operation)
  fastify.post('/me/claude-config/pull', async (request, reply) => {
    let context;
    try {
      context = extractRequestContext(request);
    } catch (error: any) {
      return reply.status(401).send({ error: error.message });
    }

    const { userId, userEmail } = context;
    await userService.ensureUser(userId, userEmail);

    try {
      await claudeBackupService.manualPullClaudeConfig(userEmail);
      return { success: true };
    } catch (error: any) {
      console.error(
        `[Manual Pull] Failed to pull claude config: ${error.message}`
      );
      return reply.status(500).send({ error: 'Failed to pull claude config' });
    }
  });

  // Claude Backup Settings API - Get backup settings
  fastify.get('/me/settings/claude/backup', async (request, reply) => {
    let context;
    try {
      context = extractRequestContext(request);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }

    try {
      const settings = await userService.getUserSettings(context.userId);
      return { claudeConfigSync: settings.claudeConfigSync };
    } catch (error: any) {
      console.error('Failed to get backup settings:', error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // Claude Backup Settings API - Update backup settings
  fastify.patch<{ Body: { claudeConfigSync: boolean } }>(
    '/me/settings/claude/backup',
    async (request, reply) => {
      let context;
      try {
        context = extractRequestContext(request);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }

      const { claudeConfigSync } = request.body;

      if (claudeConfigSync === undefined) {
        return reply
          .status(400)
          .send({ error: 'claudeConfigSync is required' });
      }

      try {
        await userService.updateUserSettings(
          context.userId,
          context.userEmail,
          { claudeConfigSync }
        );
        return { success: true, claudeConfigSync };
      } catch (error: any) {
        console.error('Failed to update backup settings:', error);
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  // Claude Backup Settings API - Pull (restore) from workspace
  fastify.post('/me/settings/claude/backup/pull', async (request, reply) => {
    let context;
    try {
      context = extractRequestContext(request);
    } catch (error: any) {
      return reply.status(401).send({ error: error.message });
    }

    const { userId, userEmail } = context;
    await userService.ensureUser(userId, userEmail);

    try {
      await claudeBackupService.pullClaudeConfig(userEmail);
      return { success: true };
    } catch (error: any) {
      console.error(
        `[Backup Pull] Failed to pull claude config: ${error.message}`
      );
      return reply.status(500).send({ error: 'Failed to pull claude config' });
    }
  });

  // Claude Backup Settings API - Push (backup) to workspace
  fastify.post('/me/settings/claude/backup/push', async (request, reply) => {
    let context;
    try {
      context = extractRequestContext(request);
    } catch (error: any) {
      return reply.status(401).send({ error: error.message });
    }

    const { userId, userEmail } = context;
    await userService.ensureUser(userId, userEmail);

    try {
      await claudeBackupService.pushClaudeConfig(userEmail);
      return { success: true };
    } catch (error: any) {
      console.error(
        `[Backup Push] Failed to push claude config: ${error.message}`
      );
      return reply.status(500).send({ error: 'Failed to push claude config' });
    }
  });
};

export default userRoutes;
