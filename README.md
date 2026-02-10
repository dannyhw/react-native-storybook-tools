# react-native-storybook-tools

A monorepo of developer tools for [React Native Storybook](https://github.com/storybookjs/react-native). Browse, search, and control your stories from an in-app dev tools panel or directly from VS Code.

**VScode Extension**

- openvsx: https://open-vsx.org/extension/dannyhw/vscode-react-native-storybook
- vscode: https://marketplace.visualstudio.com/items?itemName=dannyhw.vscode-react-native-storybook

<video src="https://github.com/user-attachments/assets/49adfbf5-1176-4ba1-9d56-bf8e96faa565"></video>

**Rozenite Plugin**

<video src="https://github.com/user-attachments/assets/b2cde9d1-c04d-4089-bc85-a8d0383389e9"></video>


## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@dannyhw/rozenite-storybook`](./rozenite-plugin) | In-app Storybook dev tools panel powered by [Rozenite](https://rozenite.dev) | 0.0.2 |
| [`vscode-react-native-storybook`](./vscode-extension) | VS Code extension for browsing and controlling stories | 0.0.3 |
| [`example`](./example) | Expo demo app showing both integrations | — |

## How It Works

Both tools connect to a running React Native Storybook instance over **WebSocket** (default port `7007`). They receive the full story index, render it as a searchable tree, and send selection events back to the app in real time.

```
┌─────────────┐       WebSocket       ┌──────────────────┐
│  RN App +   │◄─────────────────────►│  Rozenite Panel  │
│  Storybook  │                       └──────────────────┘
│             │       WebSocket       ┌──────────────────┐
│             │◄─────────────────────►│  VS Code Ext     │
└─────────────┘                       └──────────────────┘
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3.5+
- [React Native Storybook](https://github.com/storybookjs/react-native) v10.2+
- Node.js 18+

### Install Dependencies

```bash
bun install
```

### Run the Example App

```bash
# Start the Expo dev server
bun run example:start

# Or target a specific platform
bun run example:ios
bun run example:android
```

The example app boots straight into Storybook with WebSocket connections enabled and Rozenite dev tools configured.

## Rozenite Plugin

An in-app dev tools panel that lets you browse and select stories without leaving your simulator/device.

### Installation

```bash
npm install -D @dannyhw/rozenite-storybook
```

### Setup

**1. Configure Metro** to enable both Rozenite and Storybook WebSockets:

```js
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withRozenite } = require("@rozenite/metro");
const { withStorybook } = require("@storybook/react-native/metro/withStorybook");

const config = getDefaultConfig(__dirname);

module.exports = withRozenite(
  withStorybook(config, {
    websockets: "auto",
  })
);
```

**2. Enable WebSockets** in your Storybook entry:

```tsx
// .rnstorybook/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { view } from "./storybook.requires";

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
  enableWebsockets: true,
});

export default StorybookUIRoot;
```

**3. Run the app** and open Rozenite dev tools. Click **Connect** to attach to the Storybook instance.

### Development

```bash
# Build the plugin
bun run build

# Dev mode with hot reload
bun run dev
```

## VS Code Extension

Browse your full story tree in the VS Code sidebar, click to select stories on device, and jump to source files.

### Features

- Dedicated Storybook activity bar with a hierarchical tree view (groups / components / stories)
- Story index generated from your `.rnstorybook` config via `@storybook/react-native/node`
- Live selection sync — clicking a story in VS Code selects it on device, and vice versa
- Inline action to open story source files

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `reactNativeStorybook.host` | `localhost` | WebSocket/REST host |
| `reactNativeStorybook.port` | `7007` | WebSocket/REST port |
| `reactNativeStorybook.configPath` | `""` | Path to `.rnstorybook` directory |
| `reactNativeStorybook.autoConnect` | `true` | Auto-connect on activation |

### Commands

- **Storybook: Connect** — Connect to the running Storybook WebSocket server
- **Storybook: Disconnect** — Disconnect from the server
- **Storybook: Refresh Stories** — Re-index stories from the project
- **Storybook: Select Story** — Select a story by ID
- **Storybook: Open Story File** — Open the source file for a story

### Development

```bash
cd vscode-extension

# Compile
bun run compile

# Watch mode
bun run watch

# Package as .vsix
bun run package
```

## Project Structure

```
react-native-storybook-tools/
├── rozenite-plugin/           # @dannyhw/rozenite-storybook
│   ├── src/
│   │   ├── StorybookDevToolsPanel.tsx   # Main panel component
│   │   ├── components/        # UI: StoryTree, SearchBar, ConnectionPanel, etc.
│   │   ├── hooks/             # useWebSocket, usePulseAnimation
│   │   ├── utils/             # Tree-building logic
│   │   ├── theme/             # Color tokens
│   │   └── icons/             # SVG icon components
│   ├── rozenite.config.ts     # Panel registration
│   └── vite.config.ts
│
├── vscode-extension/          # vscode-react-native-storybook
│   └── src/
│       ├── extension.ts       # Extension entry point
│       ├── storyTreeProvider.ts  # TreeDataProvider implementation
│       ├── wsClient.ts        # WebSocket client
│       ├── tree.ts            # Tree utilities
│       ├── config.ts          # Settings handling
│       └── types.ts
│
├── example/                   # Expo demo app
│   ├── components/            # Sample components with stories
│   ├── .rnstorybook/          # Storybook configuration
│   └── metro.config.js        # Metro with Rozenite + Storybook
│
├── package.json               # Workspace root (Bun workspaces)
├── bunfig.toml
└── AGENTS.md                  # AI agent instructions
```

## Tech Stack

- **Package manager:** [Bun](https://bun.sh) with workspaces
- **Language:** TypeScript (strict mode)
- **Rozenite plugin:** Vite 7, React 19, React Native 0.81
- **VS Code extension:** VS Code API, CommonJS
- **Example app:** Expo 54, Storybook 10
- **Formatting:** Prettier (default config)

## Scripts Reference

| Command | Description |
|---------|-------------|
| `bun install` | Install all workspace dependencies |
| `bun run build` | Build the Rozenite plugin |
| `bun run dev` | Dev mode for the Rozenite plugin |
| `bun run example:start` | Start the Expo example app |
| `bun run example:ios` | Run example on iOS |
| `bun run example:android` | Run example on Android |
| `bun run repo:fix` | Fix dependency version mismatches with Sherif |

## License

MIT
