## Rozenite Storybook

To get setup

```sh
npm install -D @dannyhw/rozenite-storybook
```

_Update to atleast React Native Storybook 10.2_

Make sure your storybook is setup for websocket connection.

Firstly in `metro.config.js`

```js
// metro.config.js
module.exports = withRozenite(
  withStorybook(config, {
    websockets: "auto",
  })
);
```

Then in `.rnstorybook/index.tsx`

```tsx
// .rnstorybook/index.tsx
const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
  enableWebsockets: true,
});
```

Run the app and then open your dev tools.
Click connect to attach to the storybook instance.
