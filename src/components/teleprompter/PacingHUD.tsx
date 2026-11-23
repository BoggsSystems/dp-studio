import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  List, 
  Maximize, 
  Minimize, 
  Video, 
  VideoOff, 
  Square,
  X,
  Sparkles
} from 'lucide-react';
import { PrompterState, OpticalConfig, ScriptToken } from './teleprompterTypes';
import { RecordingState } from './useMediaRecorder';
import { formatTime, calculateEstimatedSeconds, calculatePacingDelta } from './pacingCalculator';

interface PacingHUDProps {
  prompterState: PrompterState;
  elapsedSeconds: number;
  totalWordCount: number;
  currentWordIndex: number;
  config: OpticalConfig;
  cuePauseRemaining: number;
  activeCue: ScriptToken | null;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (wpm: number) => void;
  onToggleSettings: () => void;
  onToggleNav: () => void;
  onExit: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  activeSectionTitle?: string;
  recordingState: RecordingState;
  recordingDurationSec: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  showCameraPreview: boolean;
  onToggleCameraPreview: () => void;
}

export const PacingHUD: React.FC<PacingHUDProps> = ({
  prompterState,
  elapsedSeconds,
  totalWordCount,
  currentWordIndex,
  config,
  cuePauseRemaining,
  activeCue,
  onTogglePlay,
  onReset,
  onSpeedChange,
  onToggleSettings,
  onToggleNav,
  onExit,
  onToggleFullscreen,
  isFullscreen,
  activeSectionTitle,
  recordingState,
  recordingDurationSec,
  onStartRecording,
  onStopRecording,
  showCameraPreview,
  onToggleCameraPreview,
}) => {
  const estimatedTotalSec = calculateEstimatedSeconds(totalWordCount, config.targetWpm);
  const remainingSec = Math.max(0, estimatedTotalSec - elapsedSeconds);
  const { label: pacingLabel, secondsDelta } = calculatePacingDelta(currentWordIndex, elapsedSeconds, config.targetWpm);
  const progressPercent = totalWordCount > 0 ? Math.min(100, Math.round((currentWordIndex / totalWordCount) * 100)) : 0;

  // If reading anchor is at top (14%), place HUD at bottom to avoid blocking eye line!
  const isHudAtBottom = config.anchorPosition === 'top';

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        zIndex: 30,
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
        bottom: isHudAtBottom ? '16px' : 'auto',
        top: isHudAtBottom ? 'auto' : '16px',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Cue Pause Banner Alert */}
        {prompterState === 'CUE_PAUSED' && (
          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 20px',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.6)',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#fbbf24',
              }}
            />
            <span style={{ color: '#fde68a', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>
              {activeCue?.cueLabel || 'Stage Pause'}
            </span>
            <span
              style={{
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: '15px',
                fontWeight: 800,
                background: 'rgba(217, 119, 6, 0.4)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(251, 191, 36, 0.4)',
              }}
            >
              {cuePauseRemaining}s
            </span>
            <span style={{ color: '#fde68a', fontSize: '11px' }}>Press Space to skip</span>
          </div>
        )}

        {/* Main Floating Glass HUD Bar */}
        <div
          style={{
            pointerEvents: 'auto',
            width: '100%',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.08)',
            backdropFilter: 'blur(16px)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Play/Pause, Record, Reset & State */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onTogglePlay}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: prompterState === 'SCROLLING' ? '#38bdf8' : '#1e293b',
                color: prompterState === 'SCROLLING' ? '#090e17' : '#ffffff',
                boxShadow: prompterState === 'SCROLLING' ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none',
              }}
              title="Spacebar to Play/Pause"
            >
              {prompterState === 'SCROLLING' ? (
                <>
                  <Pause size={15} />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={15} />
                  <span>Scroll</span>
                </>
              )}
            </button>

            {/* Take Recording Button */}
            {recordingState === 'RECORDING' ? (
              <button
                onClick={onStopRecording}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(239, 68, 68, 0.5)',
                }}
                title="Stop Recording and Review Video"
              >
                <Square size={13} fill="#ffffff" />
                <span>REC {formatTime(recordingDurationSec)}</span>
              </button>
            ) : recordingState === 'COUNTDOWN' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#fca5a5',
                }}
              >
                <span>Starting in 3...</span>
              </div>
            ) : (
              <button
                onClick={onStartRecording}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                }}
                title="Record video take directly on desktop"
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                  }}
                />
                <span>Record Take</span>
              </button>
            )}

            <button
              onClick={onReset}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Reset to Top (Key: R)"
            >
              <RotateCcw size={15} />
            </button>

            {/* Status Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background:
                    prompterState === 'SCROLLING'
                      ? '#10b981'
                      : prompterState === 'CUE_PAUSED'
                      ? '#f59e0b'
                      : '#64748b',
                }}
              />
              <span style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {prompterState === 'SCROLLING'
                  ? 'LIVE'
                  : prompterState === 'CUE_PAUSED'
                  ? 'PAUSE'
                  : 'READY'}
              </span>
            </div>
          </div>

          {/* Center: Timing Metrics, Progress & Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Elapsed</span>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px' }}>{formatTime(elapsedSeconds)}</span>
              </div>
              <span style={{ color: '#475569' }}>/</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Rem</span>
                <span style={{ color: '#94a3b8' }}>{formatTime(remainingSec)}</span>
              </div>
              <span style={{ color: '#475569' }}>|</span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background:
                    secondsDelta > 8
                      ? 'rgba(245, 158, 11, 0.2)'
                      : secondsDelta < -8
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                  color:
                    secondsDelta > 8
                      ? '#fbbf24'
                      : secondsDelta < -8
                      ? '#38bdf8'
                      : '#34d399',
                  border:
                    secondsDelta > 8
                      ? '1px solid rgba(245, 158, 11, 0.4)'
                      : secondsDelta < -8
                      ? '1px solid rgba(56, 189, 248, 0.4)'
                      : '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                {pacingLabel}
              </span>
            </div>

            {/* Progress Bar & Section Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <div
                style={{
                  width: '180px',
                  height: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)',
                    borderRadius: '999px',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
              {activeSectionTitle && (
                <span style={{ fontSize: '10px', color: '#94a3b8', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeSectionTitle}
                </span>
              )}
            </div>
          </div>

          {/* Right: WPM Speed Gauge & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* WPM Gauge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '3px 6px',
              }}
            >
              <button
                onClick={() => onSpeedChange(Math.max(60, config.targetWpm - 5))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
                title="Decrease Speed (Arrow Down)"
              >
                -
              </button>
              <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, minWidth: '58px', textAlign: 'center' }}>
                {config.targetWpm} <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 400 }}>WPM</span>
              </span>
              <button
                onClick={() => onSpeedChange(Math.min(300, config.targetWpm + 5))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
                title="Increase Speed (Arrow Up)"
              >
                +
              </button>
            </div>

            {/* Webcam Backdrop Toggle */}
            <button
              onClick={onToggleCameraPreview}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: showCameraPreview ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: showCameraPreview ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: showCameraPreview ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={showCameraPreview ? 'Hide Camera Backdrop' : 'Show Mirrored Camera Backdrop'}
            >
              {showCameraPreview ? <Video size={15} /> : <VideoOff size={15} />}
            </button>

            {/* Sections / Table of Contents */}
            <button
              onClick={onToggleNav}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Table of Contents (Jump Sections)"
            >
              <List size={15} />
            </button>

            {/* Settings Overlay */}
            <button
              onClick={onToggleSettings}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Optical Settings (Font, Width, Contrast)"
            >
              <Sliders size={15} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={onToggleFullscreen}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Toggle Fullscreen (Key: F)"
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>

            {/* Close / Return to Editor */}
            <button
              onClick={onExit}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px',
              }}
              title="Exit Teleprompter (Esc)"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
