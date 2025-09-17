module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Expo Router
      require.resolve('expo-router/babel'),
      // Doit rester en dernier
      'react-native-reanimated/plugin',
    ],
  };
};
