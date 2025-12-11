import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { execSync } from 'child_process';

// Security: Validate that the path is within the workspace
function validatePath(workspacePath: string, targetPath: string): string {
  const resolved = path.resolve(workspacePath, targetPath);
  const relative = path.relative(workspacePath, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path outside workspace');
  }

  return resolved;
}

// Security: Block dangerous commands
const BLOCKED_COMMANDS = ['rm -rf', 'mkfs', 'dd', ':(){:|:&};:', 'fork'];

function isCommandAllowed(command: string): boolean {
  return !BLOCKED_COMMANDS.some((blocked) => command.includes(blocked));
}

// Tool definitions for Claude
export function getTools(workspacePath: string) {
  return [
    {
      name: 'read_file',
      description: 'Read the contents of a file at the specified path',
      input_schema: {
        type: 'object' as const,
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to read',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description: 'Write content to a file at the specified path',
      input_schema: {
        type: 'object' as const,
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to write',
          },
          content: {
            type: 'string',
            description: 'The content to write to the file',
          },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'list_directory',
      description: 'List files and directories at the specified path',
      input_schema: {
        type: 'object' as const,
        properties: {
          path: {
            type: 'string',
            description: 'The directory path to list',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'search_files',
      description: 'Search for files using glob patterns',
      input_schema: {
        type: 'object' as const,
        properties: {
          pattern: {
            type: 'string',
            description:
              'The glob pattern to search for files (e.g., "**/*.ts")',
          },
        },
        required: ['pattern'],
      },
    },
    {
      name: 'grep_search',
      description: 'Search for text within files using grep',
      input_schema: {
        type: 'object' as const,
        properties: {
          pattern: {
            type: 'string',
            description: 'The text pattern to search for',
          },
          path: {
            type: 'string',
            description:
              'The path to search in (defaults to current directory)',
          },
        },
        required: ['pattern'],
      },
    },
    {
      name: 'run_command',
      description: 'Execute a shell command (restricted for security)',
      input_schema: {
        type: 'object' as const,
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to execute',
          },
        },
        required: ['command'],
      },
    },
  ];
}

// Execute tools
export async function executeTool(
  toolName: string,
  toolInput: any,
  workspacePath: string
): Promise<string> {
  try {
    switch (toolName) {
      case 'read_file': {
        const filePath = validatePath(workspacePath, toolInput.path);
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
      }

      case 'write_file': {
        const filePath = validatePath(workspacePath, toolInput.path);
        await fs.writeFile(filePath, toolInput.content, 'utf-8');
        return `File written successfully: ${toolInput.path}`;
      }

      case 'list_directory': {
        const dirPath = validatePath(workspacePath, toolInput.path || '.');
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const formatted = entries
          .map((entry) => {
            const type = entry.isDirectory() ? '[DIR]' : '[FILE]';
            return `${type} ${entry.name}`;
          })
          .join('\n');
        return formatted || 'Empty directory';
      }

      case 'search_files': {
        const pattern = toolInput.pattern;
        const files = await glob(pattern, {
          cwd: workspacePath,
          nodir: true,
          ignore: ['node_modules/**', '.git/**', 'dist/**'],
        });
        return files.length > 0 ? files.join('\n') : 'No files found';
      }

      case 'grep_search': {
        const searchPath = toolInput.path
          ? validatePath(workspacePath, toolInput.path)
          : workspacePath;
        const pattern = toolInput.pattern;

        try {
          const result = execSync(
            `grep -r "${pattern}" "${searchPath}" 2>/dev/null || true`,
            {
              cwd: workspacePath,
              maxBuffer: 1024 * 1024 * 10,
              encoding: 'utf-8',
            }
          );
          return result.trim() || 'No matches found';
        } catch (error) {
          return 'No matches found';
        }
      }

      case 'run_command': {
        const command = toolInput.command;

        if (!isCommandAllowed(command)) {
          return 'Error: Command blocked for security reasons';
        }

        try {
          const result = execSync(command, {
            cwd: workspacePath,
            maxBuffer: 1024 * 1024 * 10,
            encoding: 'utf-8',
            timeout: 30000,
          });
          return result.trim();
        } catch (error: any) {
          return `Error executing command: ${error.message}`;
        }
      }

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
}
