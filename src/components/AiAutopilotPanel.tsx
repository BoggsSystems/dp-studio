import { useState } from 'react';
import { Sparkles, Check, CheckCheck, Loader2, ArrowRight } from 'lucide-react';
import { AiTagDetection } from '../types';
import { api } from '../services/api';

interface AiAutopilotPanelProps {
  videoUrl?: string;
  onAdoptDetection: (detection: AiTagDetection) => void;
  onAdoptAllDetections: (detections: AiTagDetection[]) => void;
}

export default function AiAutopilotPanel({
  videoUrl,
  onAdoptDetection,
  onAdoptAllDetections,
}: AiAutopilotPanelProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [detections, setDetections] = useState<AiTagDetection[]>([]);
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set());

  const handleRunScan = async () => {
    if (!videoUrl) {
      alert('Please upload or load a video source before running the AI Autopilot scan.');
      return;
    }

    setIsScanning(true);
    try {
      const results = await api.scanVideoWithAi(videoUrl);
      setDetections(results);
    } catch (err: any) {
      alert(`AI scan warning: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAdopt = (detection: AiTagDetection) => {
    onAdoptDetection(detection);
    setAdoptedIds((prev) => new Set(prev).add(detection.id));
  };

  const handleAdoptAll = () => {
    onAdoptAllDetections(detections);
    setAdoptedIds(new Set(detections.map((d) => d.id)));
  };

  return (
    <div className="surface-panel" style={{ marginTop: '20px' }}>
      <div className="panel-header">
        <div>
          <div className="panel-title">
            <Sparkles size={16} color="var(--accent-amber)" />
            <span>AI Autopilot Product & Entity Scanner</span>
          </div>
          <div className="panel-desc">
            Computer vision samples video frames and transcripts to extract shoppable showcase moments automatically.
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleRunScan}
          disabled={isScanning || !videoUrl}
          style={{ fontSize: '12px' }}
        >
          {isScanning ? (
            <>
              <Loader2 size={13} className="spin" /> Scanning Video Frames...
            </>
          ) : (
            <>
              <Sparkles size={13} /> Run AI Scan
            </>
          )}
        </button>
      </div>

      {detections.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              AI identified <strong>{detections.length} shoppable moments</strong> in this video:
            </span>

            <button
              className="btn btn-ghost"
              style={{ fontSize: '12px', color: 'var(--accent-teal)' }}
              onClick={handleAdoptAll}
            >
              <CheckCheck size={14} /> Accept All as Shoppable Pins
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {detections.map((det) => {
              const isAdopted = adoptedIds.has(det.id);

              return (
                <div
                  key={det.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    opacity: isAdopted ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--accent-blue)',
                        fontWeight: 600,
                      }}
                    >
                      {det.timestampSeconds.toFixed(1)}s
                    </div>

                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {det.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {det.category} • Suggested: ${det.suggestedPrice.toFixed(2)} • Confidence: {Math.round(det.confidence * 100)}%
                      </div>
                    </div>
                  </div>

                  <button
                    className={`btn ${isAdopted ? 'btn-ghost' : 'btn-secondary'}`}
                    style={{ fontSize: '11px', padding: '5px 12px' }}
                    onClick={() => !isAdopted && handleAdopt(det)}
                    disabled={isAdopted}
                  >
                    {isAdopted ? (
                      <>
                        <Check size={12} color="var(--status-online)" /> Added
                      </>
                    ) : (
                      <>
                        <ArrowRight size={12} /> Add Pin
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
