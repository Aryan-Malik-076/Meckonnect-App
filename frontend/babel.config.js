module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      'react-native-reanimated/plugin', // Reanimated plugin
      [
        'module-resolver', // Module resolver plugin with alias
        {
          alias: {
            '@': './',
          },
        },
      ],
    ],
  };
};
