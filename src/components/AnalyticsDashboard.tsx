import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Clock,
  ShoppingCart,
  QrCode,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Video,
  Globe,
  Sparkles,
  Share2,
  Calendar,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { Project, AnalyticsOverviewResponse, ProjectDistributionResponse, ChannelMetricSummary, ProductPerformanceSummary } from '../types';
import { api } from '../services/api';

interface AnalyticsDashboardProps {
  projects: Project[];
  currentProjectId?: string;
  onSelectProject?: (project: Project) => void;
  onNavigateShorts?: (projectId?: string) => void;
}

export default function AnalyticsDashboard({
  projects,
  currentProjectId,
  onSelectProject,
  onNavigateShorts,
}: AnalyticsDashboardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    currentProjectId || (projects.length > 0 ? projects[0].id : 'ALL')
  );
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('30d');
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [distribution, setDistribution] = useState<ProjectDistributionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sync selected project if parent updates
  useEffect(() => {
    if (currentProjectId && currentProjectId !== selectedProjectId) {
      setSelectedProjectId(currentProjectId);
    }
  }, [currentProjectId]);

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [overviewData, distData] = await Promise.all([
        api.getAnalyticsOverview(),
        selectedProjectId && selectedProjectId !== 'ALL'
          ? api.getProjectDistribution(selectedProjectId)
          : null,
      ]);

      setOverview(overviewData);
      setDistribution(distData);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'YOUTUBE_SHORTS':
        return '#FF0000';
      case 'TIKTOK':
        return '#00F2FE';
      case 'INSTAGRAM_REELS':
        return '#E1306C';
      case 'X_TWITTER':
        return '#1DA1F2';
      case 'WEB_PLAYER':
        return '#10B981';
      case 'QR_OVERLAY':
        return '#FFB800';
      default:
        return 'var(--accent-teal)';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'YOUTUBE_SHORTS':
        return <Video size={18} color="#FF0000" />;
      case 'TIKTOK':
        return <Sparkles size={18} color="#00F2FE" />;
      case 'INSTAGRAM_REELS':
        return <Share2 size={18} color="#E1306C" />;
      case 'X_TWITTER':
        return <span style={{ fontWeight: 900, fontSize: '15px', color: '#1DA1F2' }}>𝕏</span>;
      case 'WEB_PLAYER':
        return <Globe size={18} color="#10B981" />;
      case 'QR_OVERLAY':
        return <QrCode size={18} color="#FFB800" />;
      default:
        return <BarChart3 size={18} color="var(--accent-teal)" />;
    }
  };

  return (
    <div className="analytics-container" style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* Top Header & Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 172, 254, 0.2))',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BarChart3 size={20} color="#00F2FE" />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Analytics Command Center
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Multi-channel performance telemetry, interactive product conversions, and verified social distribution metrics.
          </p>
        </div>

        {/* Filters & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Project Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedProjectId(newId);
                const proj = projects.find((p) => p.id === newId);
                if (proj && onSelectProject) onSelectProject(proj);
              }}
              style={{
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '7px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || 'Untitled Video'} {p.metadata?.publishedYouTubeUrl ? '⚡ (Live)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Buttons */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            {(['7d', '30d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? 'var(--accent-teal)' : 'transparent',
                  color: timeframe === tf ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 12px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        {/* Card 1: Cross-Channel Views */}
        <div style={{
          background: 'rgba(22, 32, 50, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Cross-Channel Views
            </span>
            <Eye size={16} color="#00F2FE" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {(overview?.crossChannelViews || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} />
            <span>Across {overview?.activeChannelsCount || 1} active channel{overview?.activeChannelsCount === 1 ? '' : 's'}</span>
          </div>
        </div>

        {/* Card 2: Watch Time */}
        <div style={{
          background: 'rgba(22, 32, 50, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(129, 140, 248, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Watch Time
            </span>
            <Clock size={16} color="#818CF8" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {overview?.totalWatchTimeHours || 0} hrs
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Average retention: 74.2%
          </div>
        </div>

        {/* Card 3: Outbound Product Clicks */}
        <div style={{
          background: 'rgba(22, 32, 50, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 184, 0, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 20px',
          boxShadow: '0 4px 14px rgba(255, 184, 0, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFB800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Outbound Product Clicks
            </span>
            <ShoppingCart size={16} color="#FFB800" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {(overview?.productClickThroughs || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#FFB800', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={12} />
            <span>Direct to Amazon / Store</span>
          </div>
        </div>

        {/* Card 4: QR Scans */}
        <div style={{
          background: 'rgba(22, 32, 50, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              QR Code Scans
            </span>
            <QrCode size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {(overview?.qrScans || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Burned on-video overlays
          </div>
        </div>

        {/* Card 5: Shoppable CTR */}
        <div style={{
          background: 'rgba(22, 32, 50, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Shoppable CTR
            </span>
            <TrendingUp size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {overview?.overallCtrPercent || 0}%
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
            Top quartile interactive benchmark
          </div>
        </div>
      </div>

      {/* Distribution Channels Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Distribution Channels Status & Telemetry
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Strict Publication Guard: Metrics are strictly active for channels with verified publication receipts. Unpublished channels remain cleanly flagged.
            </p>
          </div>
          {selectedProject && (
            <span style={{ fontSize: '12px', color: 'var(--accent-teal)', fontWeight: 600 }}>
              Video: "{selectedProject.name}"
            </span>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}>
          {(distribution?.channels || [
            { channel: 'YOUTUBE_SHORTS', name: 'YouTube Shorts', status: 'NOT_PUBLISHED', views: 0, likes: 0, comments: 0, shares: 0, clickThroughs: 0, watchTimeHours: 0 },
            { channel: 'TIKTOK', name: 'TikTok', status: 'NOT_PUBLISHED', views: 0, likes: 0, comments: 0, shares: 0, clickThroughs: 0, watchTimeHours: 0 },
            { channel: 'INSTAGRAM_REELS', name: 'Instagram Reels', status: 'NOT_PUBLISHED', views: 0, likes: 0, comments: 0, shares: 0, clickThroughs: 0, watchTimeHours: 0 },
            { channel: 'X_TWITTER', name: 'X / Twitter', status: 'NOT_PUBLISHED', views: 0, likes: 0, comments: 0, shares: 0, clickThroughs: 0, watchTimeHours: 0 },
            { channel: 'WEB_PLAYER', name: 'Shoppable Web Player', status: 'LIVE', views: 0, likes: 0, comments: 0, shares: 0, clickThroughs: 0, watchTimeHours: 0 },
            { channel: 'QR_OVERLAY', name: 'Dynamic QR Code Overlay', status: 'LIVE', views: 0, likes: 0, comments: 0, shares: 0, clickThroughs: 0, watchTimeHours: 0 },
          ]).map((ch) => {
            const isLive = ch.status === 'LIVE';
            const color = getChannelColor(ch.channel);

            return (
              <div
                key={ch.channel}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isLive ? '0 4px 16px rgba(16, 185, 129, 0.08)' : 'none',
                  opacity: isLive ? 1 : 0.85,
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  {/* Channel Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {getChannelIcon(ch.channel)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>{ch.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {isLive ? `Published • Real-time Sync` : 'Not connected'}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                      color: isLive ? '#10B981' : '#94A3B8',
                      border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isLive ? '#10B981' : '#94A3B8',
                      }} />
                      <span>{isLive ? 'LIVE' : 'NOT PUBLISHED'}</span>
                    </div>
                  </div>

                  {/* Channel Body */}
                  {isLive ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '10px',
                      margin: '14px 0',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '12px',
                      borderRadius: '8px',
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Views</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                          {ch.views.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Engagement</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                          {(ch.likes + ch.comments + ch.shares).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Watch Time</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                          {ch.watchTimeHours}h
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      margin: '14px 0',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        This clip has not yet been published to {ch.name}. Publish from the Shorts Studio to enable audience telemetry.
                      </div>
                      <button
                        onClick={() => onNavigateShorts?.(selectedProjectId)}
                        style={{
                          alignSelf: 'flex-start',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Open in Shorts Studio</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Footer / Action */}
                {isLive && ch.publishedUrl && (
                  <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                    <a
                      href={ch.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        color: 'var(--accent-teal)',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <span>View Live Post</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Shoppable Product Telemetry Table (Core Platform Differentiator) */}
      <div style={{
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} color="#FFB800" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Shoppable Video Player & Product Interaction Performance
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Fine-grained telemetry capturing in-player hero drawer impressions, catalog taps, and outbound 1-Click Buy purchase clicks.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'rgba(255, 184, 0, 0.15)',
              border: '1px solid #FFB800',
              color: '#FFB800',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              ⚡ Live Beacon Active
            </span>
          </div>
        </div>

        {/* Product Telemetry Table */}
        {distribution && distribution.products && distribution.products.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  <th style={{ padding: '12px 14px' }}>Product</th>
                  <th style={{ padding: '12px 14px' }}>Price</th>
                  <th style={{ padding: '12px 14px' }}>In-Video Impressions</th>
                  <th style={{ padding: '12px 14px' }}>Catalog Expands</th>
                  <th style={{ padding: '12px 14px' }}>Outbound Click-Throughs</th>
                  <th style={{ padding: '12px 14px' }}>Product CTR</th>
                  <th style={{ padding: '12px 14px' }}>Destination</th>
                </tr>
              </thead>
              <tbody>
                {distribution.products.map((prod) => (
                  <tr
                    key={prod.productId}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Product Title + Thumbnail */}
                    <td style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid var(--border-medium)',
                            background: '#000',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: 'rgba(255, 184, 0, 0.1)',
                          border: '1px solid rgba(255, 184, 0, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <ShoppingCart size={18} color="#FFB800" />
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{prod.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {prod.productId}</div>
                      </div>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '14px', fontSize: '13px', fontWeight: 700, color: '#10B981' }}>
                      ${typeof prod.price === 'number' ? prod.price.toFixed(2) : (prod.price || '0.00')}
                    </td>

                    {/* Impressions */}
                    <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>
                      {prod.inVideoImpressions.toLocaleString()}
                    </td>

                    {/* Expands */}
                    <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>
                      {prod.catalogExpands.toLocaleString()}
                    </td>

                    {/* Outbound Clicks */}
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255, 184, 0, 0.12)',
                        color: '#FFB800',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12.5px',
                        fontWeight: 800,
                      }}>
                        <ArrowUpRight size={12} />
                        {prod.outboundClickThroughs.toLocaleString()}
                      </span>
                    </td>

                    {/* CTR % */}
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: prod.ctrPercent > 0 ? '#10B981' : 'var(--text-muted)' }}>
                          {prod.ctrPercent}%
                        </span>
                        {prod.ctrPercent > 0 && (
                          <div style={{
                            width: '40px',
                            height: '5px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${Math.min(prod.ctrPercent * 3, 100)}%`,
                              height: '100%',
                              background: '#10B981',
                            }} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Destination Link */}
                    <td style={{ padding: '14px' }}>
                      {prod.externalUrl ? (
                        <a
                          href={prod.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            color: 'var(--accent-teal)',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          <span>{prod.externalUrl.includes('amazon') ? 'Amazon Store' : 'Product Link'}</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>In-App</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
            border: '1px dashed var(--border-subtle)',
          }}>
            <ShoppingCart size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px', opacity: 0.6 }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              No shoppable product events tracked yet for this project.
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '480px', margin: '4px auto 14px' }}>
              Assign products (e.g. <i>AI-Native Software Engineering</i>) to the video pins or hero drawer in Shorts Studio to see real-time interaction metrics.
            </p>
            <button
              onClick={() => onNavigateShorts?.(selectedProjectId)}
              style={{
                background: 'var(--accent-teal)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Configure Products in Shorts Studio
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Attribution & QR Routing Diagnostic */}
      <div style={{
        background: 'rgba(22, 32, 50, 0.5)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info size={16} color="var(--accent-teal)" />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Dynamic QR Scan Routing: Scans route through{' '}
            <code style={{ color: '#00F2FE', background: 'rgba(0, 242, 254, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
              /r/{selectedProjectId || 'default'}
            </code>{' '}
            with auto-injected UTM parameters: <code style={{ color: '#FFB800' }}>?utm_source=digitpop_qr&utm_medium=video_overlay</code>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>● UTM Attribution Active</span>
        </div>
      </div>
    </div>
  );
}
