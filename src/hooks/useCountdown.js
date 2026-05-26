import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to manage a countdown timer.
 * Useful for resending OTP codes and display timeouts.
 * 
 * @param {number} initialSeconds - Starting time in seconds
 * @returns {object} { secondsLeft, isRunning, reset, start }
 */
export function useCountdown(initialSeconds = 60) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback((newSeconds = initialSeconds) => {
    clearTimer();
    setSecondsLeft(newSeconds);
    setIsRunning(true);
  }, [initialSeconds, clearTimer]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    // Start interval
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer]);

  return {
    secondsLeft,
    isRunning,
    reset,
    start
  };
}
