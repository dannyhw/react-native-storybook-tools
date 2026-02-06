# Implementation Todos

- [ ] Scaffold VS Code extension under `vscode/` with name `vscode-react-native-storybook`.
- [ ] Implement config discovery for `.rnstorybook` and optional override setting.
- [ ] Load story index via `@storybook/react-native/node` `buildIndex`.
- [ ] Port tree builder from rozenite plugin and expose proper group/component/story structure.
- [ ] Build TreeDataProvider with selection state and refresh.
- [ ] Implement WebSocket client for RN Storybook channel (connect, disconnect, events).
- [ ] Wire commands and view contributions in `package.json`.
- [ ] Add REST fallback to fetch `/index.json` when WS unavailable.
- [ ] Validate with manual run and update docs/README.
