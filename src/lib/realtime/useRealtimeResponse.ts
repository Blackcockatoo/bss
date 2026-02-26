import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getResponse,
  getIdleResponse,
  getWarningResponse,
  getAnticipatoryResponse,
  getAudioToneForResponse,
  type PetResponse,
  type ResponseContext
} from '@/lib/realtime/responseSystem';

export interface UseRealtimeResponseOptions {
  autoIdleInterval?: number; // milliseconds between idle responses
  enableWarnings?: boolean;
  enableAnticipation?: boolean;
  enableAudio?: boolean;
  onAudioTrigger?: (digits: number[]) => Promise<void>; // Callback to play audio
}

export function useRealtimeResponse(context: ResponseContext, options: UseRealtimeResponseOptions = {}) {
  const {
    autoIdleInterval = 8000,
    enableWarnings = true,
    enableAnticipation = true,
    enableAudio = false,
    onAudioTrigger,
  } = options;

  const [currentResponse, setCurrentResponse] = useState<PetResponse | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [responseHistory, setResponseHistory] = useState<PetResponse[]>([]);
  const [consecutiveActionCount, setConsecutiveActionCount] = useState(0);
  const lastActionRef = useRef<string | null>(null);
  const lastActionTimeRef = useRef<number>(0);

  // Play audio for response if enabled
  const playResponseAudio = useCallback(async (response: PetResponse) => {
    if (enableAudio && response.audioTrigger && onAudioTrigger) {
      const digits = getAudioToneForResponse(response.audioTrigger);
      if (digits.length > 0) {
        try {
          await onAudioTrigger(digits);
        } catch (error) {
          console.warn('Failed to play response audio:', error);
        }
      }
    }
  }, [enableAudio, onAudioTrigger]);

  // Handle chain reactions
  const handleChainReaction = useCallback((response: PetResponse) => {
    if (response.chainReaction) {
      // Delay chain reaction to appear after main response
      const chainDelay = setTimeout(() => {
        setCurrentResponse(response.chainReaction!);
        setIsVisible(true);
        setResponseHistory(prev => [response.chainReaction!, ...prev.slice(0, 9)]);

        // Play audio for chain reaction
        void playResponseAudio(response.chainReaction!);

        // Auto-hide chain reaction
        const hideTimer = setTimeout(() => {
          setIsVisible(false);
        }, response.chainReaction!.duration);

        return () => clearTimeout(hideTimer);
      }, response.duration);

      return () => clearTimeout(chainDelay);
    }
  }, [playResponseAudio]);

  // Trigger a response for a specific action
  const triggerResponse = useCallback(
    (action: string) => {
      // Track consecutive actions for streak detection
      const now = Date.now();
      const timeSinceLastAction = now - lastActionTimeRef.current;

      if (lastActionRef.current === action && timeSinceLastAction < 10000) {
        setConsecutiveActionCount(prev => prev + 1);
      } else {
        setConsecutiveActionCount(1);
      }

      lastActionRef.current = action;
      lastActionTimeRef.current = now;

      // Get response with updated context
      const enhancedContext = {
        ...context,
        consecutiveActions: consecutiveActionCount,
      };

      const response = getResponse(action, enhancedContext);
      setCurrentResponse(response);
      setIsVisible(true);
      setResponseHistory(prev => [response, ...prev.slice(0, 9)]);

      // Play audio for response
      void playResponseAudio(response);

      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, response.duration);

      // Handle chain reaction
      const chainCleanup = handleChainReaction(response);

      return () => {
        clearTimeout(timer);
        if (chainCleanup) chainCleanup();
      };
    },
    [context, consecutiveActionCount, playResponseAudio, handleChainReaction],
  );

  // Trigger idle response
  const triggerIdleResponse = useCallback(() => {
    const response = getIdleResponse(context);
    setCurrentResponse(response);
    setIsVisible(true);
    setResponseHistory(prev => [response, ...prev.slice(0, 9)]);

    // Play audio for idle response
    void playResponseAudio(response);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, response.duration);

    return () => clearTimeout(timer);
  }, [context, playResponseAudio]);

  // Trigger anticipatory response
  const triggerAnticipationResponse = useCallback(() => {
    if (!enableAnticipation) return;

    const response = getAnticipatoryResponse(context);
    if (response && !isVisible) {
      setCurrentResponse(response);
      setIsVisible(true);
      setResponseHistory(prev => [response, ...prev.slice(0, 9)]);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, response.duration);

      return () => clearTimeout(timer);
    }
  }, [context, enableAnticipation, isVisible]);

  // Check for warnings
  useEffect(() => {
    if (!enableWarnings) return;

    const warning = getWarningResponse(context);
    if (warning && (!currentResponse || currentResponse.type !== 'warning')) {
      setCurrentResponse(warning);
      setIsVisible(true);

      // Play audio for warning
      void playResponseAudio(warning);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, warning.duration);

      return () => clearTimeout(timer);
    }
  }, [context, enableWarnings, currentResponse, playResponseAudio]);

  // Auto-trigger idle responses
  useEffect(() => {
    const interval = setInterval(() => {
      // Only show idle response if no current response is visible
      if (!isVisible) {
        triggerIdleResponse();
      }
    }, autoIdleInterval);

    return () => clearInterval(interval);
  }, [autoIdleInterval, isVisible, triggerIdleResponse]);

  // Periodically check for anticipatory responses
  useEffect(() => {
    if (!enableAnticipation) return;

    const anticipationInterval = setInterval(() => {
      // Check every 30 seconds for anticipatory responses
      triggerAnticipationResponse();
    }, 30000);

    return () => clearInterval(anticipationInterval);
  }, [enableAnticipation, triggerAnticipationResponse]);

  return {
    currentResponse,
    isVisible,
    triggerResponse,
    triggerIdleResponse,
    triggerAnticipationResponse,
    responseHistory,
    consecutiveActionCount,
  };
}
