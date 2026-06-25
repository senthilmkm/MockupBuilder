import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { exportEngine } from '@/services/exportEngine';
import { useCanvasStore } from '@/store/canvasStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    exportEngine.evictOldCachedFiles();

    // Initialize RevenueCat and sync Pro status on boot for native platforms
    if (Platform.OS !== 'web') {
      const initRevenueCat = async () => {
        try {
          const Purchases = require('react-native-purchases').default;
          const apiKey = Platform.select({
            ios: 'appl_uVJYQCXjPoHnmTpPkBpGlWVpKoW',
            android: 'goog_placeholder_android_key',
          });
          if (apiKey) {
            Purchases.configure({ apiKey });
          }
          
          const customerInfo = await Purchases.getCustomerInfo();
          const isProActive = customerInfo.entitlements.active['pro_access'] !== undefined;
          useCanvasStore.getState().setProStatus(isProActive);
        } catch (error) {
          console.warn('RevenueCat boot initialization warning:', error);
        }
      };
      initRevenueCat();
    }
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="alerts" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="help" options={{ presentation: 'modal' }} />
        <Stack.Screen name="legal/privacy" options={{ presentation: 'modal' }} />
        <Stack.Screen name="legal/terms" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
