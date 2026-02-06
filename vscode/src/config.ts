import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import type { StorybookConfig } from './types';

const MAX_SEARCH_DEPTH = 3;

export function getStorybookConfig(): StorybookConfig {
  const config = vscode.workspace.getConfiguration('reactNativeStorybook');
  const host = config.get<string>('host', 'localhost');
  const port = config.get<number>('port', 7007);
  const configPathSetting = config.get<string>('configPath', '').trim();
  const autoConnect = config.get<boolean>('autoConnect', true);

  return {
    host,
    port,
    configPath: configPathSetting.length > 0 ? configPathSetting : null,
    autoConnect,
  };
}

export function resolveConfigPath(
  workspaceRoot: string | null,
  configPath: string | null
): string | null {
  if (!configPath) return null;
  if (path.isAbsolute(configPath)) return configPath;
  if (!workspaceRoot) return null;
  return path.join(workspaceRoot, configPath);
}

export async function findConfigDir(rootDir: string, depth = 0): Promise<string | null> {
  if (depth > MAX_SEARCH_DEPTH) return null;

  const rnStorybookPath = path.join(rootDir, '.rnstorybook');
  if (fs.existsSync(rnStorybookPath)) {
    return rnStorybookPath;
  }

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'node_modules' || entry.name === '.git') continue;

    const found = await findConfigDir(path.join(rootDir, entry.name), depth + 1);
    if (found) return found;
  }

  return null;
}
