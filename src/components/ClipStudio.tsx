import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Smartphone, 
  Send 
} from 'lucide-react';
import { Clip } from '../types';
import { api } from '../services/api';

interface ClipStudioProps {
  projectId?: string;
}

export default function ClipStudio({ projectId }: ClipStudioProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [publishingClipId, setPublishingClipId] = useState<string | null>(null);

  useEffect(() => {
    api.getClips(projectId).then((data) => {
      setClips(data);
      if (data.length > 0) setSelectedClip(data[0]);
    });
  }, [projectId]);

  const handlePublish = async (clipId: string, platform: 'YOUTUBE_SHORTS' | 'TIKTOK' | 'INSTAGRAM_REELS' | 'X_TWITTER') => {
    setPublishingClipId(`${clipId}_${platform}`);
    try {
      const res = await api.publishClip(clipId, platform);
      setClips((prev) =>
        prev.map((c) => {
          if (c.id === clipId) {
            const logs = c.distributionLogs || [];
            return {
              ...c,
              distributionLogs: [
                ...logs.filter((l) => l.platform !== platform),
                { platform, status: 'PUBLISHED', postUrl: res.postUrl, publishedAt: new Date().toISOString() },
              ],
            };
          }
          return c;
        })
      );
    } catch (e: any) {
      alert(`Publishing error: ${e.message}`);
    } finally {
      setPublishingClipId(null);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
      {/* Left Column: Clips List */}
      <div className="surface-panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <Sparkles size={16} color="var(--accent-amber)" />
              <span>AI Content Repurposing Engine (9:16 Shorts)</span>
            </div>
            <div className="panel-desc">
              Long-form streams and VODs automatically extracted into high-converting vertical clips with animated captions.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {clips.map((clip) => {
            const isSelected = selectedClip?.id === clip.id;

            return (
              <div
                key={clip.id}
                onClick={() => setSelectedClip(clip)}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--bg-surface)' : 'var(--bg-primary)',
                  border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--accent-emerald)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <TrendingUp size={11} /> Virality: {clip.viralityScore.toFixed(1)}/100
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {(clip.endSeconds - clip.startSeconds).toFixed(0)}s duration
                    </span>
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--accent-teal)', fontWeight: 600 }}>
                    Vertical 9:16
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {clip.hookTitle}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', fontStyle: 'italic' }}>
                  "{clip.transcriptSegment}"
                </div>

                {/* Hashtags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {clip.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-surface-elevated)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Social Distribution Badges */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>
                    1-Click Publish:
                  </span>

                  {(['TIKTOK', 'YOUTUBE_SHORTS', 'INSTAGRAM_REELS', 'X_TWITTER'] as const).map((plat) => {
                    const existing = clip.distributionLogs?.find((l) => l.platform === plat);
                    const isPublishing = publishingClipId === `${clip.id}_${plat}`;

                    return (
                      <button
                        key={plat}
                        disabled={isPublishing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublish(clip.id, plat);
                        }}
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${existing ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                          background: existing ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
                          color: existing ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {existing ? <CheckCircle2 size={10} /> : <Send size={9} />}
                        <span>{plat.replace('_', ' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: 9:16 Vertical Device Preview */}
      <div className="surface-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', alignSelf: 'flex-start' }}>
          <Smartphone size={16} color="var(--accent-teal)" />
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mobile 9:16 Preview
          </span>
        </div>

        {selectedClip ? (
          <div
            style={{
              width: '260px',
              height: '462px',
              borderRadius: '24px',
              background: '#000000',
              border: '4px solid var(--border-medium)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '16px',
            }}
          >
            {/* Background Video Simulation */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Smartphone size={48} opacity={0.3} />
            </div>

            {/* Simulated Animated Karaoke Subtitles */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>
                AI Animated Captions
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', lineHeight: 1.3 }}>
                "{selectedClip.transcriptSegment.slice(0, 75)}..."
              </div>
            </div>

            {/* In-Video Shoppable Overlay Badge */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--accent-teal)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase' }}>
                  Featured In Clip
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff' }}>
                  1-Click Checkout
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                $49.00
              </span>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '40px' }}>
            Select a clip to preview mobile rendering.
          </div>
        )}
      </div>
    </div>
  );
}
