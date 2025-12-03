import { useState, useCallback } from 'react';
import { useHaptics } from './useHaptics';

interface UseRefreshOptions {
  onRefresh: () => Promise<void>;
  hapticFeedback?: boolean;
}

export function useRefresh({ onRefresh, hapticFeedback = true }: UseRefreshOptions) {
  const [refreshing, setRefreshing] = useState(false);
  const { impactLight, notifySuccess } = useHaptics();

  const handleRefresh = useCallback(async () => {
    if (hapticFeedback) {
      impactLight();
    }

    setRefreshing(true);

    try {
      await onRefresh();
      if (hapticFeedback) {
        notifySuccess();
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, hapticFeedback, impactLight, notifySuccess]);

  return {
    refreshing,
    onRefresh: handleRefresh,
  };
}

export default useRefresh;
