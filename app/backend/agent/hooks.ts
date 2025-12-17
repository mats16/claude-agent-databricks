import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Pull from workspace to local (workspace -> local)
 * Uses: databricks workspace export-dir
 * @param overwrite - If true, adds --overwrite flag to overwrite existing local files
 */
export async function workspacePull(
  workspacePath: string,
  localPath: string,
  overwrite: boolean = false
): Promise<void> {
  const overwriteFlag = overwrite ? ' --overwrite' : '';
  const cmd = `databricks workspace export-dir "${workspacePath}" "${localPath}"${overwriteFlag}`;
  console.log(`[workspacePull] ${workspacePath} -> ${localPath} (overwrite: ${overwrite})`);
  try {
    const { stdout, stderr } = await execAsync(cmd);
    if (stdout) console.log(`[workspacePull] stdout: ${stdout}`);
    if (stderr) console.log(`[workspacePull] stderr: ${stderr}`);
    console.log(`[workspacePull] Completed`);
  } catch (error: any) {
    console.error(`[workspacePull] Error: ${error.message}`);
  }
}

/**
 * Push from local to workspace (local -> workspace)
 * Uses: databricks sync
 */
export async function workspacePush(
  localPath: string,
  workspacePath: string
): Promise<void> {
  const cmd = [
    'databricks',
    'sync',
    localPath,
    workspacePath,
    '--output',
    'json',
    '--exclude-from',
    '.gitignore',
    // Claude Code - exclude entire directories
    '--exclude',
    '".claude.json.corrupted.*"',
    '--exclude',
    '"debug/*"',
    '--exclude',
    '"telemetry/*"',
    '--exclude',
    '"shell-snapshots/*"',
    // Python
    '--exclude',
    '"*.pyc"',
    '--exclude',
    '"__pycache__"',
    // Node.js
    '--exclude',
    '"node_modules/*"',
    '--exclude',
    '".turbo/*"',
  ].join(' ');
  console.log(`[workspacePush] ${localPath} -> ${workspacePath}`);
  try {
    const { stdout, stderr } = await execAsync(cmd);
    if (stdout) console.log(`[workspacePush] stdout: ${stdout}`);
    if (stderr) console.log(`[workspacePush] stderr: ${stderr}`);
    console.log(`[workspacePush] Completed`);
  } catch (error: any) {
    console.error(`[workspacePush] Error: ${error.message}`);
  }
}
