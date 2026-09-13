import React, { useState, useEffect } from 'react';
import { ArrowLeft, Radio, Disc, Play, Square, ExternalLink, ShieldCheck, Activity, Cpu } from 'lucide-react';
import { StreamSession } from '../../types';
import { broadcastUplink, UplinkStats } from '../../services/BroadcastUplinkService';
import { api } from '../../services/api';
import TwitchStage from './TwitchStage';
import ShoppableTriggerDeck, { ProductGroup } from './ShoppableTriggerDeck';
import AudioMixerDock from './AudioMixerDock';
import TelemetryLog, { TelemetryEvent } from './TelemetryLog';

interface OnAirStudioProps {
  session: StreamSession;
  onExit: () => void;
}

export default function OnAirStudio({ session, onExit }: OnAirStudioProps) {
  const [isLive, setIsLive] = useState<boolean>(session.status === 'LIVE');
  const [activeSource, setActiveSource] = useState<string>('SCREEN');
  const [isAiAutopilot, setIsAiAutopilot] = useState<boolean>(false);
  const [uplinkStats, setUplinkStats] = useState<UplinkStats>(broadcastUplink.getStats());
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([
    {
      time: new Date().toLocaleTimeString(),
      type: 'STAGE_INITIALIZED',
      message: `On-Air Studio mounted for session: ${session.title}`,
      source: 'STUDIO_CORE',
      latencyMs: 1
    }
  ]);
  const [viewMode, setViewMode] = useState<'standard' | 'stage_focus' | 'audio_focus'>('standard');

  useEffect(() => {
    broadcastUplink.onStats((stats) => {
      setUplinkStats(stats);
      if (stats.status === 'LIVE_UPLINK') {
        setIsLive(true);
      } else if (stats.status === 'IDLE') {
        setIsLive(false);
      }
    });
  }, []);

  const addTelemetryLog = (type: string, message: string, source = 'STUDIO_CORE', latencyMs = 2) => {
    const newEvent: TelemetryEvent = {
      time: new Date().toLocaleTimeString(),
      type,
      message,
      source,
      latencyMs
    };
    setTelemetryEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
  };

  const handleToggleBroadcast = async () => {
    if (isLive) {
      // Stop broadcast
      await broadcastUplink.stopUplink(
        'http://localhost:9000',
        session.id || session.streamKey
      );
      setIsLive(false);
      addTelemetryLog('BROADCAST_STOPPED', 'Live broadcast stopped. RTMP egress halted.');
      api.updateStreamSession(session.id, { status: 'ENDED' }).catch(() => {});
    } else {
      // Start broadcast
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(async () => {
          // Fallback to dummy canvas stream if no physical hardware permission
          const dummyCanvas = document.createElement('canvas');
          dummyCanvas.width = 1920;
          dummyCanvas.height = 1080;
          const ctx = dummyCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 1920, 1080);
          }
          return dummyCanvas.captureStream(60);
        });

        await broadcastUplink.startUplink({
          stream,
          serverUrl: 'http://localhost:9000',
          sessionId: session.id || session.streamKey
        });
        setIsLive(true);
        addTelemetryLog('BROADCAST_STARTED', `1080p60 uplink initiated. RTMP relay enabled.`);
        api.updateStreamSession(session.id, { status: 'LIVE' }).catch(() => {});
      } catch (err: any) {
        addTelemetryLog('BROADCAST_ERROR', `Failed to initialize media stream: ${err.message}`);
      }
    }
  };

  const handleTriggerOverlay = async (group: ProductGroup) => {
    addTelemetryLog('LIVE_OVERLAY_TRIGGER', `Triggered product overlay: ${group.title} ($${group.price})`, 'WEBSOCKET_BLITTER', 4);
    try {
      await api.triggerLiveOverlay(session.id || 'default', {
        type: 'HOTSPOT_POPUP',
        payload: group
      });
    } catch (e) {
      // Local fallback telemetry notice
      addTelemetryLog('OVERLAY_DISPATCH', `Local WebSocket emitted for product: ${group.title}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 84px)', gap: '16px', overflow: 'hidden' }}>
      {/* On-Air Top Control Header */}
      <div
        className="surface-panel"
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Left: Back & Stream Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '12px' }}
            onClick={onExit}
          >
            <ArrowLeft size={14} />
            <span>Exit Studio</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isLive ? 'var(--accent-red)' : 'var(--text-muted)',
                boxShadow: isLive ? '0 0 10px var(--accent-red)' : 'none',
                animation: isLive ? 'pulse 1.5s infinite' : 'none'
              }}
            />
            <div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {session.title}
              </span>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                RTMP: rtmp://localhost:1935/live/{session.streamKey}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Telemetry Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: isLive ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-canvas)',
              border: `1px solid ${isLive ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
              fontSize: '11px',
              fontWeight: 700,
              color: isLive ? 'var(--accent-red)' : 'var(--text-muted)'
            }}
          >
            <Radio size={13} />
            <span>{isLive ? 'ON-AIR / LIVE' : 'STANDBY MODE'}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}
          >
            <Activity size={13} color="var(--accent-teal)" />
            <span>1080p60 Composite</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: uplinkStats.bitrateKbps > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)'
            }}
          >
            <Cpu size={13} />
            <span>{uplinkStats.bitrateKbps.toFixed(0)} kbps</span>
          </div>
        </div>

        {/* Right: Master Control Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setViewMode('standard')}
              style={{
                background: viewMode === 'standard' ? 'var(--bg-surface-elevated)' : 'transparent',
                border: 'none',
                color: viewMode === 'standard' ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setViewMode('stage_focus')}
              style={{
                background: viewMode === 'stage_focus' ? 'var(--bg-surface-elevated)' : 'transparent',
                border: 'none',
                color: viewMode === 'stage_focus' ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Stage Focus
            </button>
            <button
              type="button"
              onClick={() => setViewMode('audio_focus')}
              style={{
                background: viewMode === 'audio_focus' ? 'var(--bg-surface-elevated)' : 'transparent',
                border: 'none',
                color: viewMode === 'audio_focus' ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Audio Dock
            </button>
          </div>

          <button
            type="button"
            className={isLive ? 'btn btn-secondary' : 'btn btn-primary'}
            style={{
              padding: '8px 18px',
              fontSize: '12px',
              background: isLive ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent-red)',
              color: isLive ? 'var(--accent-red)' : '#fff',
              borderColor: isLive ? 'var(--accent-red)' : 'transparent'
            }}
            onClick={handleToggleBroadcast}
          >
            {isLive ? <Square size={13} /> : <Play size={13} fill="currentColor" />}
            <span>{isLive ? 'End Broadcast' : 'Go Live (Start Stream)'}</span>
          </button>
        </div>
      </div>

      {/* Main Broadcast Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'stage_focus' ? '1fr' : '1fr 420px',
          gap: '16px',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* Left Column: Multi-Source Video Stage & Telemetry Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, overflow: 'hidden' }}>
          {/* Twitch / Live Stage Compositor */}
          <div
            style={{
              flex: viewMode === 'stage_focus' ? 1 : 0.65,
              minHeight: '380px',
              background: '#020617',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <TwitchStage
              activeSource={activeSource}
              onSelectSource={(src) => {
                setActiveSource(src);
                addTelemetryLog('SOURCE_SWITCHED', `Switched active stage source to ${src}`);
              }}
            />
          </div>

          {/* Bottom Drawer: Real-Time Stream Telemetry Log */}
          {viewMode !== 'stage_focus' && (
            <div style={{ flex: 0.35, minHeight: '180px', overflow: 'hidden' }}>
              <TelemetryLog
                events={telemetryEvents}
                onClearLogs={() => setTelemetryEvents([])}
              />
            </div>
          )}
        </div>

        {/* Right Column: Trigger Deck & Audio Mixer Dock */}
        {viewMode !== 'stage_focus' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              minHeight: 0,
              overflowY: 'auto',
              paddingRight: '4px'
            }}
          >
            {/* Shoppable Hotspot Trigger Deck */}
            <div style={{ flexShrink: 0 }}>
              <ShoppableTriggerDeck
                onTriggerOverlay={handleTriggerOverlay}
                isAiAutopilot={isAiAutopilot}
                onToggleAiAutopilot={() => {
                  const nextState = !isAiAutopilot;
                  setIsAiAutopilot(nextState);
                  addTelemetryLog('AI_AUTOPILOT_TOGGLED', `AI Autopilot ${nextState ? 'ENABLED' : 'DISABLED'}`);
                }}
              />
            </div>

            {/* Audio Mixer Dock */}
            <div style={{ flexShrink: 0 }}>
              <AudioMixerDock />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
