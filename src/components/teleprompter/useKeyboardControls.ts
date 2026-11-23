import { useEffect } from 'react';
import { OpticalConfig } from './teleprompterTypes';

interface UseKeyboardControlsProps {
  isPrompterView: boolean;
  onTogglePlayPause: () => void;
  onSpeedChange: (newWpm: number) => void;
  onReset: () => void;
  onNextSection: () => void;
  onPrevSection: () => void;
  onToggleAnchor: () => void;
  onToggleFullscreen: () => void;
  onToggleView: () => void;
  config: OpticalConfig;
}

export function useKeyboardControls({
  isPrompterView,
  onTogglePlayPause,
  onSpeedChange,
  onReset,
  onNextSection,
  onPrevSection,
  onToggleAnchor,
  onToggleFullscreen,
  onToggleView,
  config,
}: UseKeyboardControlsProps) {
  useEffect(() => {
    if (!isPrompterView) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing if user is editing in a textarea or input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
        if (e.key === 'Escape') {
          target.blur();
          onToggleView();
        }
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onTogglePlayPause();
          break;

        case 'ArrowUp':
          e.preventDefault();
          onSpeedChange(Math.min(300, config.targetWpm + 5));
          break;

        case 'ArrowDown':
          e.preventDefault();
          onSpeedChange(Math.max(60, config.targetWpm - 5));
          break;

        // Speed presets via number row or Numpad
        case 'Digit1':
        case 'Numpad1':
          onSpeedChange(120);
          break;

        case 'Digit2':
        case 'Numpad2':
          onSpeedChange(140);
          break;

        case 'Digit3':
        case 'Numpad3':
          onSpeedChange(160);
          break;

        case 'Digit4':
        case 'Numpad4':
          onSpeedChange(180);
          break;

        // Jump sections
        case 'BracketRight':
        case 'PageDown':
          e.preventDefault();
          onNextSection();
          break;

        case 'BracketLeft':
        case 'PageUp':
          e.preventDefault();
          onPrevSection();
          break;

        case 'KeyR':
          e.preventDefault();
          onReset();
          break;

        case 'KeyT':
          e.preventDefault();
          onToggleAnchor();
          break;

        case 'KeyF':
          e.preventDefault();
          onToggleFullscreen();
          break;

        case 'KeyE':
        case 'Escape':
          e.preventDefault();
          onToggleView();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPrompterView,
    onTogglePlayPause,
    onSpeedChange,
    onReset,
    onNextSection,
    onPrevSection,
    onToggleAnchor,
    onToggleFullscreen,
    onToggleView,
    config.targetWpm,
  ]);
}
