import { useState, useEffect } from 'react';
import { Radio, Plus, Copy, Check, ExternalLink, Play, Sparkles, Key, Video, Calendar } from 'lucide-react';
import { StreamSession, ProductGroup } from '../../types';
import { api } from '../../services/api';

interface LivestreamHubProps {
  onEnterOnAirStudio: (session: StreamSession) => void;
  availableProductGroups?: ProductGroup[];
}

export default function LivestreamHub({ onEnterOnAirStudio }: LivestreamHubProps) {
  const [sessions, setSessions] = useState<StreamSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<StreamSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    api.getStreamSessions().then((data) => {
      setSessions(data);
      if (data.length > 0) setSelectedSession(data[0]);
    });
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const session = await api.createStreamSession(newTitle);
    setSessions([session, ...sessions]);
    setSelectedSession(session);
    setNewTitle('');
    setIsCreating(false);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handlePopOut = (session: StreamSession) => {
    window.open(`/broadcast/${session.id || session.streamKey}`, '_blank', 'width=1440,height=900');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
      {/* Left Column: Livestream Sessions & Live Deck */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="surface-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Radio size={18} color="var(--accent-red)" />
                <span>Livestream Broadcast Sessions</span>
              </div>
              <div className="panel-desc">
                Schedule live interactive shopping events with sub-10ms overlay synchronizers and multi-destination RTMP egress.
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={16} />
              <span>Schedule Stream</span>
            </button>
          </div>

          {/* Session Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.map((sess) => {
              const isSelected = selectedSession?.id === sess.id;
              const isLive = sess.status === 'LIVE';

              return (
                <div
                  key={sess.id}
                  style={{
                    background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                    border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onClick={() => setSelectedSession(sess)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: isLive ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-canvas)',
                        border: `1px solid ${isLive ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isLive ? 'var(--accent-red)' : 'var(--text-muted)',
                      }}
                    >
                      <Radio size={20} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {sess.title}
                        </span>
                        {isLive && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: 'var(--accent-red)',
                              color: '#fff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            LIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        Stream Key: {sess.streamKey}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopOut(sess);
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Pop Out</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEnterOnAirStudio(sess);
                      }}
                    >
                      <Play size={13} />
                      <span>Enter On-Air Studio</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pre-Configured Shoppable Product Deck */}
        <div className="surface-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Sparkles size={16} color="var(--accent-cyan)" />
                <span>Livestream Shoppable Trigger Deck</span>
              </div>
              <div className="panel-desc">
                Product moments prepared for instant WebSocket blitting during the live broadcast.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '28px' }}>⚡</div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--accent-teal)', fontWeight: 700 }}>HOT MOMENT #1</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Opportunity OS Pro Pass
                </div>
                <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 600 }}>$49.00 / Pro Access</div>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '28px' }}>📖</div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700 }}>HOT MOMENT #2</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  AI-Native Software Engineering
                </div>
                <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 600 }}>$9.99 Kindle / $24.95 Print</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Ingest & Broadcast Setup */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="surface-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Key size={16} color="var(--accent-amber)" />
              <span>Broadcast Ingest Credentials</span>
            </div>
          </div>

          {selectedSession ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  RTMP Ingest Server URL
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    readOnly
                    className="input-field"
                    style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                    value={selectedSession.whipIngestUrl || `rtmp://localhost:1985/live`}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0 12px' }}
                    onClick={() => copyToClipboard(selectedSession.whipIngestUrl || 'rtmp://localhost:1985/live', 'ingest')}
                  >
                    {copiedField === 'ingest' ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Stream Key
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    readOnly
                    className="input-field"
                    style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                    value={selectedSession.streamKey}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0 12px' }}
                    onClick={() => copyToClipboard(selectedSession.streamKey, 'streamKey')}
                  >
                    {copiedField === 'streamKey' ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live HLS Playback URL
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    readOnly
                    className="input-field"
                    style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                    value={selectedSession.hlsPlaybackUrl || `http://localhost:8080/live/${selectedSession.streamKey}.m3u8`}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0 12px' }}
                    onClick={() => copyToClipboard(selectedSession.hlsPlaybackUrl || `http://localhost:8080/live/${selectedSession.streamKey}.m3u8`, 'hls')}
                  >
                    {copiedField === 'hls' ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginTop: '6px',
                }}
              >
                💡 <strong>Broadcasting Tip</strong>: You can stream directly into `dp-studio` using your browser webcam/mic and screen capture without OBS, or push from OBS/vMix using the RTMP credentials above.
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '6px' }}
                onClick={() => onEnterOnAirStudio(selectedSession)}
              >
                <Video size={16} />
                <span>Launch Master Control Console</span>
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Select or schedule a session to inspect credentials.
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {isCreating && (
        <div className="modal-backdrop" onClick={() => setIsCreating(false)}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              Schedule New Livestream Project
            </h3>
            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Stream Title
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder="e.g. AI-Native Software Engineering Book Launch"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Calendar size={14} />
                  <span>Create Session</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
