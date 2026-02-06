import * as vscode from 'vscode';
import type { StoryIndex, TreeNode } from './types';
import { buildTree } from './tree';

interface MessageNode {
  id: string;
  label: string;
  type: 'message';
}

export type ViewNode = TreeNode | MessageNode;

export class StoryTreeProvider implements vscode.TreeDataProvider<ViewNode> {
  private tree: TreeNode[] = [];
  private message: string | null = null;
  private selectedStoryId: string | null = null;

  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<
    ViewNode | undefined | void
  >();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  setIndex(index: StoryIndex | null) {
    if (index) {
      this.tree = buildTree(Object.values(index.entries));
      this.message = null;
    } else {
      this.tree = [];
    }
    this.refresh();
  }

  setMessage(message: string | null) {
    this.message = message;
    if (message) this.tree = [];
    this.refresh();
  }

  setSelectedStoryId(storyId: string | null) {
    this.selectedStoryId = storyId;
    this.refresh();
  }

  refresh() {
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: ViewNode): vscode.TreeItem {
    if (element.type === 'message') {
      const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
      item.contextValue = 'message';
      item.iconPath = new vscode.ThemeIcon('info');
      return item;
    }

    const isStory = element.type === 'story';
    const collapsibleState = element.children.length
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;

    const item = new vscode.TreeItem(element.name, collapsibleState);
    item.id = element.id;
    item.contextValue = element.type;

    if (isStory && element.storyId) {
      item.command = {
        command: 'vscodeReactNativeStorybook.selectStory',
        title: 'Select Story',
        arguments: [element.storyId],
      };
      item.iconPath = new vscode.ThemeIcon(
        element.storyId === this.selectedStoryId ? 'circle-filled' : 'circle-outline'
      );
    } else if (element.type === 'component') {
      item.iconPath = new vscode.ThemeIcon('symbol-module');
    } else {
      item.iconPath = new vscode.ThemeIcon('folder');
    }

    return item;
  }

  getChildren(element?: ViewNode): Thenable<ViewNode[]> {
    if (this.message && !element) {
      return Promise.resolve([
        {
          id: 'message',
          label: this.message,
          type: 'message',
        },
      ]);
    }

    if (!element) {
      return Promise.resolve(this.tree);
    }

    if (element.type === 'message') return Promise.resolve([]);

    return Promise.resolve(element.children || []);
  }

  getSelectedStoryId() {
    return this.selectedStoryId;
  }

  getTree() {
    return this.tree;
  }
}
