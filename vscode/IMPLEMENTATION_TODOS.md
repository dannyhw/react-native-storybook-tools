# Implementation Todos

- [x] Scaffold VS Code extension under `vscode/` with name `vscode-react-native-storybook`.
- [x] Implement config discovery for `.rnstorybook` and optional override setting.
- [x] Load story index via `@storybook/react-native/node` `buildIndex`.
- [x] Port tree builder from rozenite plugin and expose proper group/component/story structure.
- [x] Build TreeDataProvider with selection state and refresh.
- [x] Implement WebSocket client for RN Storybook channel (connect, disconnect, events).
- [x] Wire commands and view contributions in `package.json`.
- [x] Add REST fallback to fetch `/index.json` when WS unavailable.
- [ ] Validate with manual run and update docs/README.
