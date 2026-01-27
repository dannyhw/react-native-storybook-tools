// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { withRozenite } = require("@rozenite/metro");
const {
  withStorybook,
} = require("@storybook/react-native/metro/withStorybook");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withRozenite(
  withStorybook(config, {
    websockets: "auto",
  }),
);
