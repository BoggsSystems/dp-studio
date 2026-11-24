import { useState } from 'react';
import { X, Copy, Check, Code, Globe, QrCode, ExternalLink, Zap, RefreshCw } from 'lucide-react';
import { Project } from '../types';

interface DeployModalProps {
  project: Project;
  onClose: () => void;
}

export default function DeployModal({ project, onClose }: DeployModalProps) {
  const [activeTab, setActiveTab] = useState<'social' | 'script' | 'iframe' | 'react' | 'qr'>('social');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isSyncingEdge, setIsSyncingEdge] = useState(false);
  const [edgeManifestUrl, setEdgeManifestUrl] = useState<string | null>(null);

  const initialSocial = Boolean(
    (project.metadata as any)?.distributions?.socialPage?.status === 'PUBLISHED' ||
    (project.metadata as any)?.isPublishedToSocial
  );
  const [isPublishedToSocial, setIsPublishedToSocial] = useState(initialSocial);
  const [isTogglingSocial, setIsTogglingSocial] = useState(false);

  const apiBase = (
    (import.meta as any).env?.VITE_API_URL ||
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:9000'
      : 'https://digitpop.opportunity-system.com')
  ).replace(/\/+$/, '');
  const playerBase = (import.meta.env.VITE_PLAYER_URL || 'https://player.shopvideo.tv').replace(/\/+$/, '');
  const playerUrl = `${playerBase}/ad/${project.id}`;
  const scriptSnippet = `<script src="${playerBase}/embed.js" data-shopvideo-id="${project.id}" async></script>`;
  const iframeSnippet = `<iframe\n  width="100%"\n  height="540"\n  src="${playerUrl}?embed=1"\n  title="${project.name}"\n  frameborder="0"\n  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"\n  allowfullscreen\n></iframe>`;
  const reactSnippet = `import { ShopVideoPlayer } from '@shopvideo/player-react';\n\nexport default function ShoppableFeature() {\n  return (\n    <ShopVideoPlayer\n      projectId="${project.id}"\n      mode="responsive"\n      onProductClick={(product) => console.log('1-Click checkout:', product)}\n    />\n  );\n}`;


  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  const handleSyncEdgeManifest = async () => {
    setIsSyncingEdge(true);
    try {
      const res = await fetch(`${apiBase}/api/videos/publish-edge-manifest/${project.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEdgeManifestUrl(data.edgeManifestUrl);
      }
    } catch (e) {
      console.warn('Edge manifest sync warning:', e);
    } finally {
      setIsSyncingEdge(false);
    }
  };

  const handleToggleSocialPublish = async () => {
    setIsTogglingSocial(true);
    const newStatus = !isPublishedToSocial;
    try {
      const res = await fetch(`${apiBase}/api/publisher/social/videos/${project.id}/distribution`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublishedToSocial: newStatus }),
      });
      if (res.ok) {
        setIsPublishedToSocial(newStatus);
      }
    } catch (e) {
      console.warn('Social toggle warning:', e);
    } finally {
      setIsTogglingSocial(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Deploy & Embed Shoppable Video
            </h3>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Format Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${activeTab === 'social' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('social')}
              style={{ fontSize: '12px' }}
            >
              <Globe size={13} /> 📱 ShopVideo Social
            </button>
            <button
              className={`btn ${activeTab === 'script' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('script')}
              style={{ fontSize: '12px' }}
            >
              <Zap size={13} /> 1-Line Script (Universal)
            </button>
            <button
              className={`btn ${activeTab === 'iframe' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('iframe')}
              style={{ fontSize: '12px' }}
            >
              <Code size={13} /> Responsive iFrame Embed
            </button>
            <button
              className={`btn ${activeTab === 'react' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('react')}
              style={{ fontSize: '12px' }}
            >
              React / Web Component
            </button>
            <button
              className={`btn ${activeTab === 'qr' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('qr')}
              style={{ fontSize: '12px' }}
            >
              <QrCode size={13} /> Mobile App QR Code
            </button>
          </div>

          {activeTab === 'social' && (
            <div>
              <div 
                style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px 0' }}>
                      Publish to ShopVideo Social Storefront
                    </h4>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                      Distribute this shoppable reel directly to your public creator storefront at{' '}
                      <strong style={{ color: '#38bdf8' }}>shop.shopvideo.tv/@jeffboggs</strong>
                    </p>
                  </div>

                  <button
                    onClick={handleToggleSocialPublish}
                    disabled={isTogglingSocial}
                    style={{
                      padding: '8px 18px',
                      background: isPublishedToSocial ? 'rgba(239, 68, 68, 0.15)' : '#0284c7',
                      border: isPublishedToSocial ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                      borderRadius: '8px',
                      color: isPublishedToSocial ? '#f87171' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: isTogglingSocial ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isPublishedToSocial ? 'Remove from Social' : '🚀 Publish to Social'}
                  </button>
                </div>

                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '10px 14px', 
                    background: '#020617', 
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: isPublishedToSocial ? '#4ade80' : '#64748b' 
                      }} 
                    />
                    <span style={{ fontSize: '12px', color: '#e2e8f0' }}>
                      Status: {isPublishedToSocial ? 'Live on Storefront' : 'Draft / Off-air'}
                    </span>
                  </div>

                  <a
                    href="https://shop.shopvideo.tv/@jeffboggs"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#38bdf8',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    <span>View Live Storefront</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'script' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Paste this 1-line script into Shopify, WordPress, Webflow, or any HTML page:
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={() => handleCopy(scriptSnippet, 'script')}
                >
                  {copiedType === 'script' ? <Check size={12} color="var(--status-online)" /> : <Copy size={12} />}
                  <span>{copiedType === 'script' ? 'Copied!' : 'Copy Tag'}</span>
                </button>
              </div>

              <pre
                style={{
                  background: 'var(--bg-primary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--accent-teal-light)',
                  overflowX: 'auto',
                  lineHeight: 1.5,
                }}
              >
                {scriptSnippet}
              </pre>

              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(56, 189, 248, 0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {edgeManifestUrl ? (
                    <span style={{ color: 'var(--status-online)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={12} color="var(--status-online)" />
                      <span>Edge Manifest live on Cloudflare CDN: {edgeManifestUrl}</span>
                    </span>
                  ) : (
                    <span>Cloudflare Edge Manifest ensures global &lt;30ms cold-start streaming.</span>
                  )}
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px', gap: '4px' }}
                  onClick={handleSyncEdgeManifest}
                  disabled={isSyncingEdge}
                >
                  <RefreshCw size={11} className={isSyncingEdge ? 'spin' : ''} />
                  <span>{isSyncingEdge ? 'Publishing...' : 'Sync Edge Manifest'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'iframe' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Embed anywhere on WordPress, Shopify, Next.js, or Webflow:
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={() => handleCopy(iframeSnippet, 'iframe')}
                >
                  {copiedType === 'iframe' ? <Check size={12} color="var(--status-online)" /> : <Copy size={12} />}
                  <span>{copiedType === 'iframe' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre
                style={{
                  background: 'var(--bg-primary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--accent-teal-light)',
                  overflowX: 'auto',
                  lineHeight: 1.5,
                }}
              >
                {iframeSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'react' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Modern React 18 TypeScript SDK snippet:
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={() => handleCopy(reactSnippet, 'react')}
                >
                  {copiedType === 'react' ? <Check size={12} color="var(--status-online)" /> : <Copy size={12} />}
                  <span>{copiedType === 'react' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre
                style={{
                  background: 'var(--bg-primary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#93c5fd',
                  overflowX: 'auto',
                  lineHeight: 1.5,
                }}
              >
                {reactSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'qr' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '160px',
                  height: '160px',
                  margin: '0 auto 16px',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000000',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <QrCode size={130} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Scan to Open on iPhone / Android
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Opens the native player with 1-click Apple Pay / Google Pay support.
              </div>
            </div>
          )}

          {/* Direct Link */}
          <div
            style={{
              marginTop: '20px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ minWidth: 0, flex: 1, marginRight: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Direct Player URL
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {playerUrl}
              </div>
            </div>

            <button
              className="btn btn-ghost"
              style={{ fontSize: '12px' }}
              onClick={() => window.open(playerUrl, '_blank')}
            >
              <ExternalLink size={13} /> Open
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
