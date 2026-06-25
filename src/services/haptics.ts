import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class HapticService {
  private isEnabled: boolean = true;

  setHapticsEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  getHapticsEnabled(): boolean {
    return this.isEnabled;
  }

  selection() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    Haptics.selectionAsync().catch(() => {});
  }

  lightImpact() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  mediumImpact() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }

  heavyImpact() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }

  success() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }

  error() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }
}

export const haptics = new HapticService();
