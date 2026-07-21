import { useEffect, useRef, useCallback } from 'react';

interface UseAutoLockOptions {
  timeoutMinutes: number;
  onLock: () => void;
  enabled: boolean;
}

export const useAutoLock = ({ timeoutMinutes, onLock, enabled }: UseAutoLockOptions) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled && timeoutMinutes > 0) {
      timerRef.current = setTimeout(() => {
        onLock();
      }, timeoutMinutes * 60 * 1000);
    }
  }, [timeoutMinutes, onLock, enabled]);

  useEffect(() => {
    if (!enabled || timeoutMinutes <= 0) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetTimer();

    resetTimer();
    events.forEach(e => document.addEventListener(e, handleActivity, true));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => document.removeEventListener(e, handleActivity, true));
    };
  }, [enabled, timeoutMinutes, resetTimer]);
};