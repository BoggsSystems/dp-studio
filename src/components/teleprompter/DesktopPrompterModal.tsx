import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { OpticalConfig, ScriptToken, SectionHeader } from './teleprompterTypes';
import { useScrollEngine } from './useScrollEngine';
import { useKeyboardControls } from './useKeyboardControls';
import { useMediaRecorder } from './useMediaRecorder';
import { ReadingAnchorGuide } from './ReadingAnchorGuide';
import { PacingHUD } from './PacingHUD';
import { SectionNav } from './SectionNav';
import { ControlOverlay } from './ControlOverlay';
import { VideoReviewModal } from './VideoReviewModal';
import { parseShoppableScript } from '../record/scriptParser';
import { Product } from '../../types';

interface DesktopPrompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: string;
  targetWpm: number;
  catalogProducts?: Product[];
  selectedProductIds?: string[];
  onUseTakeInProject?: (videoUrl: string, durationSeconds: number) => void;
}

export default function DesktopPrompterModal({
  isOpen,
  onClose,
  script,
  targetWpm,
  catalogProducts = [],
  selectedProductIds = [],
  onUseTakeInProject,
}: DesktopPrompterModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Optical Config tuned for desktop screen reading
  const [config, setConfig] = useState<OpticalConfig>({
    anchorPosition: 'top',
    anchorTopPercent: 16, // Top 16% right below mounted webcam/Continuity Camera
    columnWidthPx: 480,  // Narrow foveal column to prevent eye-darting
    fontSizePx: 34,
    lineHeight: 1.7,
    theme: 'oled-black',
    showGuideLine: true,
    showVignette: true,
    textAlignment: 'center',
    targetWpm: targetWpm || 140,
    autoPauseOnCues: true,
  });

  // Sync targetWpm when prop changes
  useEffect(() => {
    if (targetWpm) {
      setConfig((prev) => ({ ...prev, targetWpm }));
    }
  }, [targetWpm]);

  // Parse script tokens & sections
  const { tokens, sections, totalWordCount } = useMemo(() => {
    return parseShoppableScript(script);
  }, [script]);

  const updateConfig = useCallback((updates: Partial<OpticalConfig>) => {
    setConfig((prev) => ({ ...prev, updates: undefined, ...updates }));
  }, []);

  // 60fps Scroll Engine
  const {
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
    seekToTokenId,
    handleWheel,
  } = useScrollEngine({
    tokens,
    config,
    containerRef,
    contentRef,
  });

  // MediaRecorder + Camera Preview
  const {
    recordingState,
    countdown,
    recordingDurationSec,
    recordedBlobUrl,
    showCameraPreview,
    previewOpacity,
    videoPreviewRef,
    startRecordingFlow,
    stopRecording,
    dismissReview,
    downloadRecording,
    setShowCameraPreview,
    getCameraStream,
    stopCameraStream,
  } = useMediaRecorder({
    onStartScroll: () => {
      play();
    },
    onStopScroll: () => {
      pause();
    },
  });

  // Auto-start camera preview on mount if permitted
  useEffect(() => {
    if (isOpen) {
      getCameraStream();
    } else {
      stopCameraStream();
    }
  }, [isOpen, getCameraStream, stopCameraStream]);

  // Section navigation handlers
  const handleNextSection = useCallback(() => {
    const nextSec = sections.find((s) => s.wordIndex > currentWordIndex + 5);
    if (nextSec) {
      const token = tokens[nextSec.tokenIndex];
      if (token) seekToTokenId(token.id);
    }
  }, [sections, currentWordIndex, tokens, seekToTokenId]);

  const handlePrevSection = useCallback(() => {
    const reversed = [...sections].reverse();
    const prevSec = reversed.find((s) => s.wordIndex < currentWordIndex - 5);
    if (prevSec) {
      const token = tokens[prevSec.tokenIndex];
      if (token) seekToTokenId(token.id);
    }
  }, [sections, currentWordIndex, tokens, seekToTokenId]);

  // Fullscreen handler
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  }, []);

  // Keyboard controls
  useKeyboardControls({
    isPrompterView: isOpen,
    onTogglePlayPause: togglePlayPause,
    onSpeedChange: (newWpm) => updateConfig({ targetWpm: newWpm }),
    onReset: resetToStart,
    onNextSection: handleNextSection,
    onPrevSection: handlePrevSection,
    onToggleAnchor: () => {
      const nextPos = config.anchorPosition === 'top' ? 'bottom' : 'top';
      updateConfig({
        anchorPosition: nextPos,
        anchorTopPercent: nextPos === 'top' ? 16 : 80,
      });
    },
    onToggleFullscreen: handleToggleFullscreen,
    onToggleView: onClose,
    config,
  });

  // Theme styling mapping
  const themeStyles = useMemo(() => {
    switch (config.theme) {
      case 'charcoal':
        return {
          bg: '#121212',
          text: '#f4f4f5',
          heading: '#ffffff',
          headingBorder: '#3f3f46',
        };
      case 'high-vis-yellow':
        return {
          bg: '#000000',
          text: '#fde047',
          heading: '#facc15',
          headingBorder: 'rgba(234, 179, 8, 0.4)',
        };
      case 'warm-amber':
        return {
          bg: '#000000',
          text: '#fcd34d',
          heading: '#fbbf24',
          headingBorder: 'rgba(245, 158, 11, 0.4)',
        };
      case 'oled-black':
      default:
        return {
          bg: '#000000',
          text: '#f8fafc',
          heading: '#ffffff',
          headingBorder: 'rgba(255, 255, 255, 0.15)',
        };
    }
  }, [config.theme]);

  // Active section title for HUD
  const activeSectionTitle = useMemo(() => {
    const reversed = [...sections].reverse();
    const active = reversed.find((s) => s.wordIndex <= currentWordIndex);
    return active?.title;
  }, [sections, currentWordIndex]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: themeStyles.bg,
        color: themeStyles.text,
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 3-2-1 Countdown Overlay */}
      {recordingState === 'COUNTDOWN' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              fontSize: '120px',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: '#38bdf8',
              textShadow: '0 0 40px rgba(56, 189, 248, 0.8)',
            }}
          >
            {countdown}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '12px' }}>
            Get Ready • Eye Contact on Lens
          </div>
        </div>
      )}

      {/* Floating Pacing & Control HUD */}
      <PacingHUD
        prompterState={prompterState}
        elapsedSeconds={elapsedSeconds}
        totalWordCount={totalWordCount}
        currentWordIndex={currentWordIndex}
        config={config}
        cuePauseRemaining={cuePauseRemaining}
        activeCue={activeCue}
        onTogglePlay={togglePlayPause}
        onReset={resetToStart}
        onSpeedChange={(wpm) => updateConfig({ targetWpm: wpm })}
        onToggleSettings={() => setIsSettingsOpen(true)}
        onToggleNav={() => setIsNavOpen(true)}
        onExit={onClose}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        activeSectionTitle={activeSectionTitle}
        recordingState={recordingState}
        recordingDurationSec={recordingDurationSec}
        onStartRecording={startRecordingFlow}
        onStopRecording={stopRecording}
        showCameraPreview={showCameraPreview}
        onToggleCameraPreview={() => setShowCameraPreview((prev) => !prev)}
      />

      {/* Video Review Modal */}
      <VideoReviewModal
        isOpen={recordingState === 'STOPPED' && recordedBlobUrl !== null}
        videoUrl={recordedBlobUrl}
        durationSeconds={recordingDurationSec}
        onDownload={downloadRecording}
        onRetake={() => {
          dismissReview();
          resetToStart();
        }}
        onClose={dismissReview}
        onUseTakeInProject={(vidUrl, durSec) => {
          onUseTakeInProject?.(vidUrl, durSec);
          dismissReview();
          onClose();
        }}
      />

      {/* Table of Contents Modal */}
      <SectionNav
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        sections={sections}
        currentWordIndex={currentWordIndex}
        onSelectSection={(sec) => {
          const targetToken = tokens[sec.tokenIndex];
          if (targetToken) seekToTokenId(targetToken.id);
        }}
      />

      {/* Optical Settings Overlay */}
      <ControlOverlay
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onUpdateConfig={updateConfig}
      />

      {/* Mirrored Translucent Camera Backdrop */}
      {showCameraPreview && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 2,
            opacity: previewOpacity,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={videoPreviewRef}
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirrored selfie framing
            }}
          />
        </div>
      )}

      {/* Optical Reading Anchor Guide */}
      <ReadingAnchorGuide config={config} />

      {/* Main Scrolling Viewport Container */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          zIndex: 10,
          cursor: prompterState === 'SCROLLING' ? 'none' : 'default',
        }}
      >
        {/* Scrolling Text Track */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            transform: `translate3d(0, -${scrollOffset}px, 0)`,
            willChange: 'transform',
          }}
        >
          <div
            ref={contentRef}
            style={{
              width: `${config.columnWidthPx}px`,
              fontSize: `${config.fontSizePx}px`,
              lineHeight: config.lineHeight,
              textAlign: config.textAlignment,
              paddingTop: `${config.anchorTopPercent}vh`,
              paddingBottom: '85vh',
              color: themeStyles.text,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 500,
              transition: 'color 0.2s ease',
            }}
          >
            {tokens.map((token) => {
              if (token.type === 'break') {
                return token.content === '\n\n' ? (
                  <div key={token.id} style={{ height: '24px', width: '100%' }} />
                ) : (
                  <span key={token.id}> </span>
                );
              }

              if (token.type === 'heading') {
                return (
                  <div
                    key={token.id}
                    data-token-id={token.id}
                    style={{
                      marginTop: '36px',
                      marginBottom: '16px',
                      paddingBottom: '8px',
                      borderBottom: `2px solid ${themeStyles.headingBorder}`,
                      fontWeight: 800,
                      fontSize: '1.2em',
                      color: themeStyles.heading,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {token.content}
                  </div>
                );
              }

              if (token.type === 'cue') {
                const cueType = token.cueType;

                if (cueType === 'SHOW_PRODUCT' || cueType === 'PIN_PRODUCT') {
                  return (
                    <span
                      key={token.id}
                      data-token-id={token.id}
                      data-cue-type={cueType}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        margin: '6px 4px',
                        borderRadius: '999px',
                        fontSize: '0.52em',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.6)',
                        boxShadow: '0 0 14px rgba(56, 189, 248, 0.35)',
                        verticalAlign: 'middle',
                      }}
                    >
                      🏷️ SHOW: {token.cueLabel || 'PRODUCT'}
                    </span>
                  );
                }

                if (cueType === 'CALL_TO_ACTION') {
                  return (
                    <span
                      key={token.id}
                      data-token-id={token.id}
                      data-cue-type="CALL_TO_ACTION"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        margin: '6px 4px',
                        borderRadius: '8px',
                        fontSize: '0.52em',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.6)',
                        boxShadow: '0 0 14px rgba(16, 185, 129, 0.35)',
                        verticalAlign: 'middle',
                      }}
                    >
                      ⚡ CTA: {token.cueLabel || 'ACTION'}
                    </span>
                  );
                }

                if (cueType === 'PAUSE') {
                  return (
                    <span
                      key={token.id}
                      data-token-id={token.id}
                      data-cue-type="PAUSE"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        margin: '6px 4px',
                        borderRadius: '999px',
                        fontSize: '0.52em',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.6)',
                        boxShadow: '0 0 14px rgba(245, 158, 11, 0.35)',
                        verticalAlign: 'middle',
                      }}
                    >
                      ⏱️ PAUSE {token.cueDurationSec}s
                    </span>
                  );
                }

                return (
                  <span
                    key={token.id}
                    data-token-id={token.id}
                    data-cue-type="NOTE"
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      margin: '4px 4px',
                      borderRadius: '6px',
                      fontSize: '0.52em',
                      fontFamily: 'monospace',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#94a3b8',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      verticalAlign: 'middle',
                    }}
                  >
                    📌 {token.cueLabel || token.content}
                  </span>
                );
              }

              // Word Tokens
              return (
                <span
                  key={token.id}
                  data-token-id={token.id}
                  data-word-index={token.wordIndex}
                  style={{
                    display: 'inline-block',
                    marginRight: '0.28em',
                    transition: 'opacity 0.15s ease',
                    opacity:
                      currentWordIndex >= (token.wordIndex || 0) - 2 &&
                      currentWordIndex <= (token.wordIndex || 0) + 12
                        ? 1.0
                        : 0.85,
                  }}
                >
                  {token.content}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
