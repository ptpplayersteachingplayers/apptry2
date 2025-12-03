import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export const useHaptics = () => {
  const trigger = useCallback(async (type: HapticFeedbackType = 'light') => {
    // Haptics only work on iOS and Android
    if (Platform.OS === 'web') return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      // Silently fail if haptics not available
      console.warn('Haptics not available:', error);
    }
  }, []);

  const impactLight = useCallback(() => trigger('light'), [trigger]);
  const impactMedium = useCallback(() => trigger('medium'), [trigger]);
  const impactHeavy = useCallback(() => trigger('heavy'), [trigger]);
  const notifySuccess = useCallback(() => trigger('success'), [trigger]);
  const notifyWarning = useCallback(() => trigger('warning'), [trigger]);
  const notifyError = useCallback(() => trigger('error'), [trigger]);
  const selection = useCallback(() => trigger('selection'), [trigger]);

  return {
    trigger,
    impactLight,
    impactMedium,
    impactHeavy,
    notifySuccess,
    notifyWarning,
    notifyError,
    selection,
  };
};

export default useHaptics;
