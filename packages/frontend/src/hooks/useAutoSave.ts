import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  interval?: number; // milliseconds
  enabled?: boolean;
}

export const useAutoSave = <T>({
  data,
  onSave,
  interval = 5000, // Default: save every 5 seconds
  enabled = true,
}: UseAutoSaveOptions<T>) => {
  const lastSavedDataRef = useRef<T>(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);

  const hasChanges = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current);
  }, [data]);

  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current || !hasChanges()) {
      return;
    }

    try {
      isSavingRef.current = true;
      await onSave(data);
      lastSavedDataRef.current = data;
      console.log('Auto-save successful');
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, enabled, hasChanges]);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule next save
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, interval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, save, interval, enabled]);

  // Save immediately when component unmounts
  useEffect(() => {
    return () => {
      if (enabled && hasChanges()) {
        onSave(data).catch(error => {
          console.error('Failed to save on unmount:', error);
        });
      }
    };
  }, [data, onSave, enabled, hasChanges]);

  return {
    save,
    hasUnsavedChanges: hasChanges(),
  };
};
