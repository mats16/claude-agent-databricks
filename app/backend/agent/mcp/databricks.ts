import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type { WorkspaceObject } from './types';

const databricksHost = process.env.DATABRICKS_HOST;

export const databricksMcpServer = createSdkMcpServer({
  name: 'databricks-tools',
  version: '0.0.1',
  tools: [
    tool(
      'list_workspace_objects',
      'List files and directories in a Databricks Workspace directory. Use this to explore the workspace structure.',
      {
        path: z
          .string()
          .describe(
            'The directory path in Databricks Workspace to list (e.g., /Workspace/Users/user@example.com)'
          ),
        accessToken: z
          .string()
          .describe('The access token for the Databricks API'),
      },
      async (args) => {
        const url = `https://${databricksHost}/api/2.0/workspace/list?path=${encodeURIComponent(args.path)}`;

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${args.accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          return { content: [{ type: 'text', text: JSON.stringify(data) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error}` }] };
        }
      }
    ),
    tool(
      'get_workspace_object',
      'Get the contents of a file in a Databricks Workspace directory. Use this to read the contents of a file.',
      {
        path: z
          .string()
          .describe(
            'The directory path in Databricks Workspace to list (e.g., /Workspace/Users/user@example.com)'
          ),
        accessToken: z
          .string()
          .describe('The access token for the Databricks API'),
      },
      async (args) => {
        const url = `https://${databricksHost}/api/2.0/workspace/export?path=${encodeURIComponent(args.path)}`;

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${args.accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          const data = (await response.json()) as WorkspaceObject;

          return { content: [{ type: 'text', text: JSON.stringify(data) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error}` }] };
        }
      }
    ),
  ],
});
