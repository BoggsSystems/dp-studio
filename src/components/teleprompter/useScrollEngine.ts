import { useState, useRef, useEffect, useCallback } from 'react';
import { PrompterState, OpticalConfig, ScriptToken } from './teleprompterTypes';

interface UseScrollEngineProps {
  tokens: ScriptToken[];
  config: OpticalConfig;
  containerRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  onStateChange?: (state: PrompterState) => void;
}

export function useScrollEngine({
  tokens,
  config,
  containerRef,
  contentRef,
  onStateChange,
}: UseScrollEngineProps) {
  const [prompterState, setPrompterState] = useState<PrompterState>('PAUSED');
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [cuePauseRemaining, setCuePauseRemaining] = useState<number>(0);
  const [activeCue, setActiveCue] = useState<ScriptToken | null>(null);

  // References to keep rAF loop clean without closure stale variables
  const stateRef = useRef<PrompterState>('PAUSED');
  const offsetRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const processedCueIdsRef = useRef<Set<string>>(new Set());

  // Helper to sync state changes
  const updatePrompterState = useCallback((newState: PrompterState) => {
    stateRef.current = newState;
    setPrompterState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // Calibrated Pixels per second calculation based on DOM rendered height and WPM
  const getPixelsPerSecond = useCallback((wpm: number): number => {
    const content = contentRef.current;
    const wordTokens = tokens.filter(t => t.type === 'word' && t.wordIndex !== undefined);
    const safeTotalWords = Math.max(1, wordTokens.length);

    if (content) {
      const firstToken = content.querySelector('[data-token-id]') as HTMLElement | null;
      const allTokens = content.querySelectorAll('[data-token-id]');
      const lastToken = allTokens.length > 0 ? (allTokens[allTokens.length - 1] as HTMLElement) : null;

      if (firstToken && lastToken) {
        const topStart = firstToken.offsetTop;
        const bottomEnd = lastToken.offsetTop + lastToken.offsetHeight;
        const totalTextHeightPx = Math.max(100, bottomEnd - topStart);
        
        // Exact average pixels per word including paragraph spacing and headings
        const pxPerWord = totalTextHeightPx / safeTotalWords;
        return (wpm / 60) * pxPerWord;
      }
    }

    // Accurate fallback:
    const lineHeightPx = config.fontSizePx * config.lineHeight;
    const avgWordWidthPx = config.fontSizePx * 2.8;
    const estWordsPerLine = Math.max(1.5, config.columnWidthPx / avgWordWidthPx);
    const pxPerWord = lineHeightPx / estWordsPerLine;
    return (wpm / 60) * pxPerWord;
  }, [config.fontSizePx, config.lineHeight, config.columnWidthPx, contentRef, tokens]);

  // Main 60fps Animation Loop
  const tick = useCallback((timestamp: DOMHighResTimeStamp) => {
    if (stateRef.current !== 'SCROLLING') {
      lastTimeRef.current = null;
      return;
    }

    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    const deltaSec = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    // Cap deltaSec to avoid massive jumps if tab was backgrounded
    const safeDeltaSec = Math.min(deltaSec, 0.1);

    // Calculate movement
    const pxPerSec = getPixelsPerSecond(config.targetWpm);
    const newOffset = offsetRef.current + pxPerSec * safeDeltaSec;

    // Check maximum scroll boundary using full rendered scrollHeight
    const container = containerRef.current;
    const content = contentRef.current;
    const maxScroll = content && container ? Math.max(200, content.scrollHeight - container.offsetHeight * 0.3) : 10000;

    if (newOffset >= maxScroll) {
      offsetRef.current = maxScroll;
      setScrollOffset(maxScroll);
      updatePrompterState('COMPLETED');
      return;
    }

    offsetRef.current = newOffset;
    setScrollOffset(newOffset);

    // Update elapsed presentation time
    elapsedRef.current += safeDeltaSec;
    setElapsedSeconds(Math.floor(elapsedRef.current));

    // Determine current word index & detect stage cues at the reading anchor
    if (container && content) {
      const anchorOffsetPx = (container.offsetHeight * (config.anchorTopPercent / 100)) + newOffset;
      const tokenElements = content.querySelectorAll('[data-token-id]');
      
      let foundWordIdx = -1;
      tokenElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const top = htmlEl.offsetTop;
        const bottom = top + htmlEl.offsetHeight;

        // Advance word index to the word closest to or just passed the anchor
        if (top <= anchorOffsetPx + 15) {
          const wIdx = htmlEl.getAttribute('data-word-index');
          if (wIdx !== null) {
            foundWordIdx = parseInt(wIdx, 10);
          }
        }

        // Check for unhandled cue token right at the anchor
        if (top <= anchorOffsetPx && bottom >= anchorOffsetPx - 25) {
          const cueType = htmlEl.getAttribute('data-cue-type');
          const tokenId = htmlEl.getAttribute('data-token-id');
          if (cueType && tokenId && !processedCueIdsRef.current.has(tokenId)) {
            processedCueIdsRef.current.add(tokenId);
            const token = tokens.find(t => t.id === tokenId);
            if (token && token.cueType === 'PAUSE' && config.autoPauseOnCues && (token.cueDurationSec || 0) > 0) {
              updatePrompterState('CUE_PAUSED');
              setActiveCue(token);
              setCuePauseRemaining(token.cueDurationSec || 3);
            }
          }
        }
      });

      if (foundWordIdx >= 0) {
        setCurrentWordIndex(foundWordIdx);
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);
  }, [config.targetWpm, config.anchorTopPercent, getPixelsPerSecond, containerRef, contentRef, updatePrompterState, tokens]);

  // Start Scrolling
  const play = useCallback(() => {
    if (stateRef.current === 'COMPLETED') {
      offsetRef.current = 0;
      setScrollOffset(0);
      elapsedRef.current = 0;
      setElapsedSeconds(0);
      processedCueIdsRef.current.clear();
    }
    updatePrompterState('SCROLLING');
    lastTimeRef.current = null;
    animFrameRef.current = requestAnimationFrame(tick);
  }, [tick, updatePrompterState]);

  // Pause Scrolling
  const pause = useCallback(() => {
    updatePrompterState('PAUSED');
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, [updatePrompterState]);

  // Toggle Play / Pause
  const togglePlayPause = useCallback(() => {
    if (stateRef.current === 'SCROLLING') {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  // Reset to Beginning
  const resetToStart = useCallback(() => {
    pause();
    offsetRef.current = 0;
    setScrollOffset(0);
    elapsedRef.current = 0;
    setElapsedSeconds(0);
    setCurrentWordIndex(0);
    processedCueIdsRef.current.clear();
    setActiveCue(null);
    setCuePauseRemaining(0);
  }, [pause]);

  // Seek to specific pixel offset
  const seekToOffset = useCallback((offsetPx: number) => {
    const safeOffset = Math.max(0, offsetPx);
    offsetRef.current = safeOffset;
    setScrollOffset(safeOffset);
  }, []);

  // Jump to specific Token or Section Header
  const seekToTokenId = useCallback((tokenId: string) => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const el = content.querySelector(`[data-token-id="${tokenId}"]`) as HTMLElement;
    if (el) {
      const anchorY = container.offsetHeight * (config.anchorTopPercent / 100);
      const targetOffset = Math.max(0, el.offsetTop - anchorY);
      seekToOffset(targetOffset);
    }
  }, [containerRef, contentRef, config.anchorTopPercent, seekToOffset]);

  // Manual wheel / trackpad override handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // If scrolling, pause immediately on user touch
    if (stateRef.current === 'SCROLLING') {
      pause();
      updatePrompterState('MANUAL_OVERRIDE');
    }

    const delta = e.deltaY;
    const newOffset = Math.max(0, offsetRef.current + delta);
    offsetRef.current = newOffset;
    setScrollOffset(newOffset);
  }, [pause, updatePrompterState]);

  // Handle countdown when in CUE_PAUSED state
  useEffect(() => {
    if (prompterState !== 'CUE_PAUSED') return;

    if (cuePauseRemaining > 0) {
      const timer = setTimeout(() => {
        setCuePauseRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished! Clean up and resume scrolling smoothly
      setActiveCue(null);
      play();
    }
  }, [prompterState, cuePauseRemaining, play]);

  // Ensure rAF is cleaned up on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return {
    prompterState,
    scrollOffset,
    elapsedSeconds,
    currentWordIndex,
    cuePauseRemaining,
    activeCue,
    play,
    pause,
    togglePlayPause,
    resetToStart,
    seekToOffset,
    seekToTokenId,
    handleWheel,
  };
}
