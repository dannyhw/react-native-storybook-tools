# React Native Storybook VS Code Extension

Browse and control React Native Storybook stories directly in VS Code.

## Features
- Tree view of stories (group/component/story).
- Initial story list generated via `@storybook/react-native/node` `buildIndex`.
- Live selection sync via WebSocket.

## Settings
- `reactNativeStorybook.host`: WebSocket/REST host (default `localhost`).
- `reactNativeStorybook.port`: WebSocket/REST port (default `7007`).
- `reactNativeStorybook.configPath`: Optional path to `.rnstorybook`.
- `reactNativeStorybook.autoConnect`: Auto-connect on activation.
