import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { DBSQLClient } from '@databricks/sql';
import { z } from 'zod';

const databricksHost = process.env.DATABRICKS_HOST?.replace(/^https?:\/\//, '');

// SQL Warehouse configuration
const MAX_ROWS_DEFAULT = 1000;
const MAX_ROWS_LIMIT = 10000;

type WarehouseSize = '2xs' | 'xs' | 's';

// Get WAREHOUSE_ID from size
function getWarehouseId(size: WarehouseSize): string {
  const mapping: Record<WarehouseSize, string | undefined> = {
    '2xs': process.env.WAREHOUSE_ID_2XS,
    xs: process.env.WAREHOUSE_ID_XS,
    s: process.env.WAREHOUSE_ID_S,
  };
  const id = mapping[size];
  if (!id)
    throw new Error(`WAREHOUSE_ID_${size.toUpperCase()} not configured`);
  return id;
}

// Format query result as Markdown table
function formatQueryResult(
  result: Record<string, unknown>[],
  maxRows: number
): string {
  if (!result || result.length === 0) {
    return 'Query executed successfully. No rows returned.';
  }

  const limitedResult = result.slice(0, maxRows);
  const truncated = result.length > maxRows;

  const columns = Object.keys(limitedResult[0]);
  const header = `| ${columns.join(' | ')} |`;
  const separator = `| ${columns.map(() => '---').join(' | ')} |`;
  const rows = limitedResult.map(
    (row) =>
      `| ${columns.map((col) => String(row[col] ?? 'NULL')).join(' | ')} |`
  );

  let output = [header, separator, ...rows].join('\n');

  if (truncated) {
    output += `\n\n*Results truncated. Showing ${maxRows} of ${result.length} rows.*`;
  }

  return output;
}

// Execute SQL query
async function executeQuery(
  sql: string,
  warehouseId: string,
  maxRows: number
): Promise<string> {
  const token = process.env.DATABRICKS_TOKEN;
  if (!token)
    throw new Error('DATABRICKS_TOKEN not available. User authentication required.');
  if (!databricksHost) throw new Error('DATABRICKS_HOST not configured.');

  const client = new DBSQLClient();

  try {
    await client.connect({
      token,
      host: databricksHost,
      path: `/sql/1.0/warehouses/${warehouseId}`,
    });
    const session = await client.openSession();
    const op = await session.executeStatement(sql, { runAsync: true, maxRows });
    const result = await op.fetchAll();

    await op.close();
    await session.close();
    await client.close();

    return formatQueryResult(result as Record<string, unknown>[], maxRows);
  } catch (error: unknown) {
    try {
      await client.close();
    } catch {
      /* ignore cleanup errors */
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`SQL execution failed: ${message}`);
  }
}

export const databricksMcpServer = createSdkMcpServer({
  name: 'databricks-tools',
  version: '1.0.0',
  tools: [
    tool(
      'run_sql',
      'Execute SQL on Databricks SQL Warehouse. Supports SELECT, DDL (CREATE/DROP/ALTER), and DML (INSERT/UPDATE/DELETE). Results are returned as a markdown table. Use "size" parameter to select warehouse (recommended). Only use "warehouse_id" for advanced cases.',
      {
        query: z.string().describe('SQL statement to execute'),
        size: z
          .enum(['2xs', 'xs', 's'])
          .optional()
          .describe(
            'Warehouse size: 2xs, xs, or s. Use this parameter to select warehouse (default: 2xs). Cannot be used with warehouse_id.'
          ),
        warehouse_id: z
          .string()
          .optional()
          .describe(
            'Direct warehouse ID. Only use this for advanced cases. Cannot be used with size.'
          ),
        max_rows: z
          .number()
          .min(1)
          .max(MAX_ROWS_LIMIT)
          .default(MAX_ROWS_DEFAULT)
          .optional()
          .describe(`Max rows to return (default: ${MAX_ROWS_DEFAULT})`),
      },
      async (args) => {
        try {
          // Validate mutual exclusivity
          if (args.size && args.warehouse_id) {
            throw new Error(
              'Cannot specify both "size" and "warehouse_id". Use one or the other.'
            );
          }

          const maxRows = Math.min(
            args.max_rows ?? MAX_ROWS_DEFAULT,
            MAX_ROWS_LIMIT
          );

          // Determine warehouse ID
          const warehouseId = args.warehouse_id ?? getWarehouseId(args.size ?? '2xs');

          const result = await executeQuery(args.query, warehouseId, maxRows);
          return { content: [{ type: 'text', text: result }] };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          return { content: [{ type: 'text', text: `Error: ${message}` }] };
        }
      }
    ),
    tool(
      'get_warehouse_info',
      'Get information about a Databricks SQL Warehouse including its state, size, and configuration.',
      {
        size: z
          .enum(['2xs', 'xs', 's'])
          .default('2xs')
          .optional()
          .describe('Warehouse size: 2xs (default), xs, or s'),
      },
      async (args) => {
        try {
          const token = process.env.DATABRICKS_TOKEN;
          if (!token)
            throw new Error(
              'DATABRICKS_TOKEN not available. User authentication required.'
            );
          if (!databricksHost)
            throw new Error('DATABRICKS_HOST not configured.');

          const size = args.size ?? '2xs';
          const warehouseId = getWarehouseId(size);
          const url = `https://${databricksHost}/api/2.0/sql/warehouses/${warehouseId}`;

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `API request failed: ${response.status} ${errorText}`
            );
          }

          const data = await response.json();
          return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          return { content: [{ type: 'text', text: `Error: ${message}` }] };
        }
      }
    ),
    tool(
      'list_warehouses',
      'List all Databricks SQL Warehouses available in the workspace.',
      {},
      async () => {
        try {
          const token = process.env.DATABRICKS_TOKEN;
          if (!token)
            throw new Error(
              'DATABRICKS_TOKEN not available. User authentication required.'
            );
          console.log('env', JSON.stringify(process.env, null, 2));
          if (!databricksHost)
            throw new Error('DATABRICKS_HOST not configured.');

          const url = `https://${databricksHost}/api/2.0/sql/warehouses`;

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `API request failed: ${response.status} ${errorText}`
            );
          }

          const data = await response.json();
          return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          return { content: [{ type: 'text', text: `Error: ${message}` }] };
        }
      }
    ),
  ],
});
