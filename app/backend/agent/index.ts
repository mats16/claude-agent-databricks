import Anthropic from '@anthropic-ai/sdk';
import { getTools, executeTool } from './tools.js';

// Databricks Anthropic Proxy configuration
const client = new Anthropic({
  apiKey: process.env.DATABRICKS_TOKEN || process.env.ANTHROPIC_API_KEY || '',
  baseURL: process.env.DATABRICKS_HOST
    ? `https://${process.env.DATABRICKS_HOST}/serving-endpoints/anthropic`
    : undefined,
  // Databricks uses Bearer token authentication instead of x-api-key
  defaultHeaders: process.env.DATABRICKS_HOST
    ? {
        Authorization: `Bearer ${process.env.DATABRICKS_TOKEN}`,
      }
    : undefined,
});

export interface AgentMessage {
  type: 'response' | 'tool_use' | 'tool_result' | 'error' | 'complete';
  content?: any;
  toolName?: string;
  toolInput?: any;
  toolResult?: string;
  error?: string;
}

// Process agent request with streaming
export async function* processAgentRequest(
  message: string,
  workspacePath: string
): AsyncGenerator<AgentMessage> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: message },
  ];

  const tools = getTools(workspacePath);
  let iterationCount = 0;
  const maxIterations = 20; // Prevent infinite loops

  try {
    while (iterationCount < maxIterations) {
      iterationCount++;

      // Call Claude API (via Databricks or direct)
      const response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'databricks-claude-sonnet-4-5',
        max_tokens: 4096,
        tools,
        messages,
      });

      // Process response content
      for (const block of response.content) {
        if (block.type === 'text') {
          yield {
            type: 'response',
            content: block.text,
          };
        } else if (block.type === 'tool_use') {
          yield {
            type: 'tool_use',
            toolName: block.name,
            toolInput: block.input,
          };

          // Execute the tool
          const toolResult = await executeTool(
            block.name,
            block.input,
            workspacePath
          );

          yield {
            type: 'tool_result',
            toolName: block.name,
            toolResult,
          };

          // Add tool result to message history
          messages.push({
            role: 'assistant',
            content: response.content,
          });

          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: block.id,
                content: toolResult,
              },
            ],
          });
        }
      }

      // Check if conversation is complete
      if (response.stop_reason === 'end_turn') {
        yield {
          type: 'complete',
        };
        break;
      } else if (response.stop_reason !== 'tool_use') {
        yield {
          type: 'complete',
        };
        break;
      }
    }

    if (iterationCount >= maxIterations) {
      yield {
        type: 'error',
        error: 'Maximum iteration limit reached',
      };
    }
  } catch (error: any) {
    yield {
      type: 'error',
      error: error.message || 'Unknown error occurred',
    };
  }
}
