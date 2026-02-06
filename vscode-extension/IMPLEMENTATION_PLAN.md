# React Native Storybook VS Code Extension Plan

## Goals
- Provide a VS Code view that lists React Native Storybook stories in a proper tree structure (group/component/story).
- Populate the initial story list using `buildIndex` from `@storybook/react-native/node`.
- Maintain active story selection via WebSocket connection to the Storybook channel server.
- Allow selecting a story in VS Code to set the active story in the running Storybook app.

## Non-goals (for initial delivery)
- Embedded Storybook preview inside VS Code.
- Quick-pick story search.
- Jump-to-story-source on double-click.

## Source References (local)
- Tree building logic: `/Users/danielwilliams/Developer/storybook/react-native-storybook-tools/rozenite-plugin/src/utils/tree.ts`
- WebSocket message shape: `/Users/danielwilliams/Developer/storybook/react-native-storybook-tools/rozenite-plugin/src/hooks/useWebSocket.ts`
- buildIndex export: `/Users/danielwilliams/Developer/storybook/react-native-storybook/packages/react-native/src/node.ts`
- Channel server REST/WS endpoints: `/Users/danielwilliams/Developer/storybook/react-native-storybook/packages/react-native/src/metro/channelServer.ts`
- React Native Storybook source (primary reference): `/Users/danielwilliams/Developer/storybook/react-native-storybook`
- Existing VS Code extension (older RN Storybook): `/Users/danielwilliams/Developer/storybook/vscode-react-native-storybooks`
- Existing VS Code extension scaffold (new): `/Users/danielwilliams/Developer/storybook/react-native-storybook-navigator`
- Web Storybook VS Code extension (external reference): `https://github.com/joshbolduc/vscode-story-explorer`

## Architecture
- **Extension root**: `/Users/danielwilliams/Developer/storybook/react-native-storybook-tools/vscode-extension`
- **Tree provider**: Builds a nested tree from `StoryIndex.entries` using the rozenite algorithm.
- **Index source**: `buildIndex({ configPath })` from `@storybook/react-native/node` (local file system parsing).
- **WebSocket client**: Node `ws` client to connect to `ws://<host>:<port>`.
  - On connect, send `{ type: 'RN_GET_INDEX', args: [], from: 'vscode-storybook' }` to request index from the running app.
  - Listen for `RN_GET_INDEX_RESPONSE` to refresh index in UI.
  - Listen for `SET_CURRENT_STORY` or `setCurrentStory` events to update selection.
  - On user selection, send `{ type: 'setCurrentStory', args: [{ viewMode: 'story', storyId }], from: 'vscode-storybook' }`.
- **REST fallback**: Optional `GET /index.json` to refresh index when no WS connection is available or fails.

## Configuration
- `reactNativeStorybook.host` (default `localhost`)
- `reactNativeStorybook.port` (default `7007`)
- `reactNativeStorybook.configPath` (optional) to override auto-detected `.rnstorybook` directory
- `reactNativeStorybook.autoConnect` (default `true`)

## Implementation Steps
1. **Scaffold extension**
   - Initialize VS Code extension structure under `/Users/danielwilliams/Developer/storybook/react-native-storybook-tools/vscode-extension`.
   - Ensure no nested git artifacts are copied.
   - Add `package.json`, `tsconfig.json`, and basic activation events.

2. **Index loading**
   - Implement `findConfigDir` to locate `.rnstorybook` in the workspace (max depth 3).
   - Implement `loadIndex` using `buildIndex({ configPath })` from `@storybook/react-native/node`.
   - Handle errors with a friendly tree placeholder item.

3. **Tree building**
   - Port `buildTree` from rozenite plugin to the extension.
   - Use `StoryIndex.entries` with `title` and `name` to construct `group/component/story` nodes.
   - Keep sort behavior consistent with rozenite (title/name alphabetical).

4. **Tree UI + commands**
   - Register TreeDataProvider (`storybookStories` view).
   - Add commands: `storybook.refreshIndex`, `storybook.connect`, `storybook.disconnect`, `storybook.selectStory`.
   - When a story node is clicked, emit `setCurrentStory` via WS and update selection state.

5. **WebSocket integration**
   - Manage connection lifecycle and reconnect on settings change.
   - Update selection on incoming `SET_CURRENT_STORY` / `setCurrentStory`.
   - If the server provides `RN_GET_INDEX_RESPONSE`, refresh index from that payload.

6. **REST fallback**
   - If WS not connected, allow manual refresh to fetch `http://<host>:<port>/index.json`.
   - Merge into the same tree builder.

7. **Testing + validation**
   - Manual test against local RN Storybook example.
   - Verify tree structure matches rozenite behavior.
   - Verify selection sync both directions.

## Backlog (per request)
- Embedded Storybook preview panel in VS Code (webview).
- Quick-pick story search command.
- Open story source file on double-click (jump to location).
