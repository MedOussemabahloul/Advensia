import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    'expo-router': {
      appRoot: process.env.EXPO_ROUTER_APP_ROOT || 'app',
    },
  },
});
