import * as vscode from 'vscode';
import { findConfigDir, getStorybookConfig, resolveConfigPath } from './config';
import type { StoryIndex } from './types';
import { StoryTreeProvider } from './storyTreeProvider';
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
