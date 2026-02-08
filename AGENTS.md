# AGENTS.md

## Project Overview

**react-native-storybook-tools** — A monorepo of developer tools for React Native Storybook, including an in-app dev tools panel (Rozenite plugin) and a VS Code extension for browsing/controlling stories.

## Monorepo Structure

```
├── rozenite-plugin/    # @dannyhw/rozenite-storybook — In-app Storybook dev tools panel
├── vscode-extension/   # vscode-react-native-storybook — VS Code extension for story browsing
├── example/            # Expo app demonstrating the integrations
```

## Tech Stack

- **Package manager:** Bun (v1.3.5) with workspaces
- **Language:** TypeScript (strict mode in all packages)
- **Rozenite plugin:** Vite 7, React 19, React Native 0.81, Rozenite 1.2
- **VS Code extension:** VS Code API, CommonJS modules
- **Example app:** Expo 54, Storybook 10, React Native 0.81

## Common Commands

```bash
# Install dependencies
bun install

# Build rozenite plugin
bun run build

# Dev mode for rozenite plugin
bun run dev

# Start example Expo app
bun run example:start

# Fix dependency mismatches
bun run repo:fix

# VS Code extension
cd vscode-extension && bun run compile    # Build
cd vscode-extension && bun run watch      # Watch mode
cd vscode-extension && bun run package    # Package .vsix
```

## Code Conventions

- **Components:** PascalCase filenames (`StorybookDevToolsPanel.tsx`)
- **Hooks/utils:** camelCase filenames (`useWebSocket.ts`, `tree.ts`)
- **Formatting:** Prettier (default config)
- **No linter** configured (no ESLint)
- **No test framework** configured
- **Local deps** use `workspace:*` protocol
- **Exports:** Use `index.ts` barrel files for public APIs

## Architecture Notes

- WebSocket-based communication between tools and Storybook
- Tree data structures for hierarchical story organization (kind separators: `/`)
- Rozenite plugin uses `@rozenite/plugin-bridge` for cross-context messaging
- VS Code extension implements `TreeDataProvider` for story tree view
