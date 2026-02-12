import { useState, useRef, useCallback, useEffect } from 'react';

interface TimerState {
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  isFinished: boolean;
}

// Notification sound (short beep using Web Audio API)
function playTimerSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
    oscillator.stop(audioContext.currentTime + 0.8);

    // Second beep after 300ms
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.value = 0.3;
      osc2.start();
      gain2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
      osc2.stop(audioContext.currentTime + 0.8);
    }, 300);
  } catch {
    // Web Audio API not available
  }
}

function triggerVibration() {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
}

export function useTimer(
  initialSeconds: number = 90,
  options: { sound?: boolean; vibration?: boolean } = { sound: true, vibration: true }
) {
  const [state, setState] = useState<TimerState>({
    timeLeft: initialSeconds,
    totalTime: initialSeconds,
    isRunning: false,
    isFinished: false,
  });

  const intervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
  }, []);

  const start = useCallback((seconds?: number) => {
    clearTimer();
    const duration = seconds ?? state.totalTime;
    const endTime = Date.now() + duration * 1000;
    endTimeRef.current = endTime;

    setState((prev) => ({
      ...prev,
      timeLeft: duration,
      totalTime: duration,
      isRunning: true,
      isFinished: false,
    }));

    intervalRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current! - Date.now()) / 1000));
      setState((prev) => {
        if (remaining <= 0 && !prev.isFinished) {
          if (options.sound) playTimerSound();
          if (options.vibration) triggerVibration();
          clearTimer();
          return { ...prev, timeLeft: 0, isRunning: false, isFinished: true };
        }
        return { ...prev, timeLeft: remaining };
      });
    }, 250);
  }, [state.totalTime, clearTimer, options.sound, options.vibration]);

  const pause = useCallback(() => {
    clearTimer();
    setState((prev) => ({ ...prev, isRunning: false }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (state.timeLeft > 0 && !state.isRunning) {
      const endTime = Date.now() + state.timeLeft * 1000;
      endTimeRef.current = endTime;

      setState((prev) => ({ ...prev, isRunning: true }));

      intervalRef.current = window.setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current! - Date.now()) / 1000));
        setState((prev) => {
          if (remaining <= 0 && !prev.isFinished) {
            if (options.sound) playTimerSound();
            if (options.vibration) triggerVibration();
            clearTimer();
            return { ...prev, timeLeft: 0, isRunning: false, isFinished: true };
          }
          return { ...prev, timeLeft: remaining };
        });
      }, 250);
    }
  }, [state.timeLeft, state.isRunning, clearTimer, options.sound, options.vibration]);

  const reset = useCallback((seconds?: number) => {
    clearTimer();
    const duration = seconds ?? state.totalTime;
    setState({
      timeLeft: duration,
      totalTime: duration,
      isRunning: false,
      isFinished: false,
    });
  }, [clearTimer, state.totalTime]);

  const addTime = useCallback((seconds: number) => {
    setState((prev) => {
      const newTime = Math.max(0, prev.timeLeft + seconds);
      if (prev.isRunning && endTimeRef.current) {
        endTimeRef.current += seconds * 1000;
      }
      return { ...prev, timeLeft: newTime, isFinished: false };
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    ...state,
    start,
    pause,
    resume,
    reset,
    addTime,
    progress: state.totalTime > 0 ? ((state.totalTime - state.timeLeft) / state.totalTime) * 100 : 0,
  };
}
