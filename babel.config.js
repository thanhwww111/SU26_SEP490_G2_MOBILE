module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Bắt buộc với react-native-reanimated 4 — phải là plugin cuối cùng
    plugins: ["react-native-worklets/plugin"],
  };
};
