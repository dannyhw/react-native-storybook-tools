import type { StoryEntry, TreeNode } from './types';

export function buildTree(entries: StoryEntry[]): TreeNode[] {
  const root: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  const sortedEntries = [...entries].sort((a, b) =>
    `${a.title}/${a.name}`.localeCompare(`${b.title}/${b.name}`)
  );

  for (const entry of sortedEntries) {
    if (entry.type !== 'story') continue;

    const pathParts = entry.title.split('/');
    let currentPath = '';
    let currentLevel = root;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastSegment = i === pathParts.length - 1;

      let node = nodeMap.get(currentPath);

      if (!node) {
        node = {
          id: currentPath,
          name: part,
          type: isLastSegment ? 'component' : 'group',
          depth: i,
          children: [],
        };
        nodeMap.set(currentPath, node);
        currentLevel.push(node);
      }

      currentLevel = node.children;
    }

    currentLevel.push({
      id: entry.id,
      name: entry.name,
      type: 'story',
      depth: pathParts.length,
      children: [],
      storyId: entry.id,
      importPath: entry.importPath,
    });
  }

  return root;
}

export function findStoryNode(nodes: TreeNode[], storyId: string): TreeNode | null {
  for (const node of nodes) {
    if (node.storyId === storyId) return node;
    const found = findStoryNode(node.children, storyId);
    if (found) return found;
  }
  return null;
}
