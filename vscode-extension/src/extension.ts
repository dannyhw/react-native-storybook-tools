import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { findConfigDir, getStorybookConfig, resolveConfigPath } from './config';
import type { StoryIndex } from './types';
import { StoryTreeProvider, type ViewNode } from './storyTreeProvider';
import { findStoryNode } from './tree';
import { StorybookWebSocketClient } from './wsClient';

export async function activate(context: vscode.ExtensionContext) {
  const provider = new StoryTreeProvider();
  const treeView = vscode.window.createTreeView('storybookStories', {
    treeDataProvider: provider,
    showCollapseAll: true,
  });

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
  statusBar.command = 'vscodeReactNativeStorybook.connect';
  statusBar.text = 'Storybook: Disconnected';
  statusBar.show();

  let wsClient = createWebSocketClient(provider, statusBar, updateSelection);

  async function resolveConfigDir(): Promise<string | null> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
    const config = getStorybookConfig();
    const resolved = resolveConfigPath(workspaceRoot, config.configPath);
    if (resolved) return resolved;
    if (!workspaceRoot) return null;
    return await findConfigDir(workspaceRoot);
  }

  async function loadIndexFromBuild(configDir: string): Promise<StoryIndex> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { buildIndex } = require('@storybook/react-native/node');
    return await buildIndex({ configPath: configDir });
  }

  async function loadIndexFromServer(host: string, port: number): Promise<StoryIndex> {
    const response = await fetch(`http://${host}:${port}/index.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch index: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as StoryIndex;
  }

  async function refreshIndex() {
    provider.setMessage('Loading stories...');

    const configDir = await resolveConfigDir();
    if (configDir) {
      try {
        const index = await loadIndexFromBuild(configDir);
        provider.setIndex(index);
        return;
      } catch (error) {
        console.warn('Failed to load index from buildIndex', error);
      }
    }

    const { host, port } = getStorybookConfig();
    try {
      const index = await loadIndexFromServer(host, port);
      provider.setIndex(index);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load Storybook index from buildIndex or server.';
      provider.setMessage(message);
    }
  }

  function updateSelection(storyId: string) {
    provider.setSelectedStoryId(storyId);
    const node = findStoryNode(provider.getTree(), storyId);
    if (node) {
      treeView.reveal(node, { select: true, focus: false, expand: true });
    }
  }

  const refreshCommand = vscode.commands.registerCommand(
    'vscodeReactNativeStorybook.refreshIndex',
    async () => {
      await refreshIndex();
    }
  );

  const connectCommand = vscode.commands.registerCommand('vscodeReactNativeStorybook.connect', () => {
    wsClient.connect();
  });

  const disconnectCommand = vscode.commands.registerCommand(
    'vscodeReactNativeStorybook.disconnect',
    () => {
      wsClient.disconnect();
    }
  );

  const selectStoryCommand = vscode.commands.registerCommand(
    'vscodeReactNativeStorybook.selectStory',
    (storyId: string) => {
      wsClient.selectStory(storyId);
      updateSelection(storyId);
    }
  );

  const moreActionsCommand = vscode.commands.registerCommand(
    'vscodeReactNativeStorybook.moreActions',
    async () => {
      const selected = await vscode.window.showQuickPick(
        [
          {
            label: 'Refresh Stories',
            action: 'refresh' as const,
          },
          {
            label: 'Connect',
            action: 'connect' as const,
          },
          {
            label: 'Disconnect',
            action: 'disconnect' as const,
          },
        ],
        {
          title: 'Storybook Actions',
          placeHolder: 'Choose an action',
        }
      );

      if (!selected) return;
      if (selected.action === 'refresh') {
        await refreshIndex();
        return;
      }
      if (selected.action === 'connect') {
        wsClient.connect();
        return;
      }
      wsClient.disconnect();
    }
  );

  const openStoryFileCommand = vscode.commands.registerCommand(
    'vscodeReactNativeStorybook.openStoryFile',
    async (node?: ViewNode | string) => {
      const storyId = getStoryIdFromCommandArg(node) ?? provider.getSelectedStoryId();
      if (!storyId) {
        vscode.window.showWarningMessage('No story selected.');
        return;
      }

      const storyEntry = provider.getStoryEntry(storyId);
      if (!storyEntry?.importPath) {
        vscode.window.showWarningMessage(`No file path found for story "${storyId}".`);
        return;
      }

      const storyFile = await resolveStoryFileUri(storyEntry.importPath);
      if (!storyFile) {
        vscode.window.showWarningMessage(
          `Could not resolve story file for import path "${storyEntry.importPath}".`
        );
        return;
      }

      const doc = await vscode.workspace.openTextDocument(storyFile);
      await vscode.window.showTextDocument(doc, { preview: false });
    }
  );

  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (!event.affectsConfiguration('reactNativeStorybook')) return;

    wsClient.disconnect();
    wsClient = createWebSocketClient(provider, statusBar, updateSelection);

    const { autoConnect } = getStorybookConfig();
    if (autoConnect) {
      wsClient.connect();
    }

    refreshIndex();
  });

  context.subscriptions.push(
    treeView,
    statusBar,
    refreshCommand,
    connectCommand,
    disconnectCommand,
    selectStoryCommand,
    moreActionsCommand,
    openStoryFileCommand,
    configListener
  );

  await refreshIndex();

  const { autoConnect } = getStorybookConfig();
  if (autoConnect) {
    wsClient.connect();
  }
}

export function deactivate() {}

function createWebSocketClient(
  provider: StoryTreeProvider,
  statusBar: vscode.StatusBarItem,
  onSelection: (storyId: string) => void
) {
  const { host, port } = getStorybookConfig();

  return new StorybookWebSocketClient(host, port, {
    onStatus: (status, message) => {
      if (status === 'connected') {
        statusBar.text = `Storybook: Connected (${host}:${port})`;
      } else if (status === 'connecting') {
        statusBar.text = 'Storybook: Connecting...';
      } else if (status === 'error') {
        statusBar.text = 'Storybook: Error';
        if (message) console.warn(message);
      } else {
        statusBar.text = 'Storybook: Disconnected';
      }
    },
    onIndex: (index) => {
      provider.setIndex(index);
    },
    onSelection,
  });
}

function getStoryIdFromCommandArg(node?: ViewNode | string) {
  if (typeof node === 'string') {
    return node;
  }

  if (node && node.type === 'story' && node.storyId) {
    return node.storyId;
  }

  return null;
}

async function resolveStoryFileUri(importPath: string): Promise<vscode.Uri | null> {
  const normalizedImportPath = importPath.replace(/\\/g, '/');
  if (path.isAbsolute(normalizedImportPath) && fs.existsSync(normalizedImportPath)) {
    return vscode.Uri.file(normalizedImportPath);
  }

  const relativeImportPath = normalizedImportPath.replace(/^\.\//, '');
  const folders = vscode.workspace.workspaceFolders ?? [];

  for (const folder of folders) {
    const candidate = path.resolve(folder.uri.fsPath, relativeImportPath);
    if (fs.existsSync(candidate)) {
      return vscode.Uri.file(candidate);
    }
  }

  const fileName = path.basename(relativeImportPath);
  const candidates = await vscode.workspace.findFiles(
    `**/${fileName}`,
    '**/{node_modules,.git}/**',
    200
  );
  const suffix = relativeImportPath.startsWith('/') ? relativeImportPath : `/${relativeImportPath}`;

  for (const candidate of candidates) {
    const fsPath = candidate.fsPath.replace(/\\/g, '/');
    if (fsPath.endsWith(suffix)) {
      return candidate;
    }
  }

  return candidates[0] ?? null;
}
