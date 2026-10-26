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
  Video,
  Globe,
  Sparkles,
  Share2,
  ChevronRight,
  ChevronDown,
  Info,
  ArrowLeft,
  Search,
  Package,
  Layers,
  Film
} from 'lucide-react';
import {
  Project,
  AnalyticsOverviewResponse,
  ProjectDistributionResponse,
  ProjectAnalyticsSummary,
  ProductAggregatedSummary,
  ChannelMetricSummary
} from '../types';
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
  // Top view toggle: 'videos' or 'products'
  const [activeTab, setActiveTab] = useState<'videos' | 'products'>('videos');
  
  // Drill-down video project id (null means showing the "All Videos" table)
  const [drillDownProjectId, setDrillDownProjectId] = useState<string | null>(null);

  // Timeframe filter
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('30d');

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Expandable product IDs for "Breakdown by Video" accordion
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Data states
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [projectsSummary, setProjectsSummary] = useState<ProjectAnalyticsSummary[]>([]);
  const [productsSummary, setProductsSummary] = useState<ProductAggregatedSummary[]>([]);
  const [distribution, setDistribution] = useState<ProjectDistributionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load all overview, project summaries, and product summaries
  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [overviewData, projsData, prodsData] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getProjectsAnalyticsSummary(),
        api.getProductsAnalyticsSummary(),
      ]);

      setOverview(overviewData);
      setProjectsSummary(projsData);
      setProductsSummary(prodsData);
    } catch (err) {
      console.error('Failed to load analytics summaries:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load granular distribution whenever drillDownProjectId changes
  useEffect(() => {
    if (drillDownProjectId) {
      api.getProjectDistribution(drillDownProjectId)
        .then((dist) => setDistribution(dist))
        .catch((err) => console.error('Failed to load project distribution:', err));
    } else {
      setDistribution(null);
    }
  }, [drillDownProjectId]);

  const toggleProductExpand = (productId: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'YOUTUBE_SHORTS':
        return <Video size={16} color="#FF0000" />;
      case 'TIKTOK':
        return <Sparkles size={16} color="#00F2FE" />;
      case 'INSTAGRAM_REELS':
        return <Share2 size={16} color="#E1306C" />;
      case 'X_TWITTER':
        return <span style={{ fontWeight: 900, fontSize: '13px', color: '#1DA1F2' }} title="X (Twitter)">𝕏</span>;
      case 'WEB_PLAYER':
        return <Globe size={16} color="#10B981" />;
      case 'QR_OVERLAY':
        return <QrCode size={16} color="#FFB800" />;
      default:
        return <BarChart3 size={16} color="var(--accent-teal)" />;
    }
  };

  // Filtered projects
  const filteredProjects = projectsSummary.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered products
  const filteredProducts = productsSummary.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active drilled-down project
  const currentDrillProject = projectsSummary.find((p) => p.id === drillDownProjectId) ||
    projects.find((p) => p.id === drillDownProjectId);

  return (
    <div className="analytics-container" style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
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
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                Analytics Command Center
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginTop: '2px' }}>
                Multi-channel performance telemetry, interactive product conversions, and cross-video commerce rollups.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Main Lens Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px',
            gap: '3px',
          }}>
            <button
              onClick={() => {
                setActiveTab('videos');
                setSearchQuery('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'videos' ? 'var(--accent-teal)' : 'transparent',
                color: activeTab === 'videos' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Film size={14} />
              <span>All Videos ({projectsSummary.length || projects.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('products');
                setSearchQuery('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'products' ? '#FFB800' : 'transparent',
                color: activeTab === 'products' ? '#0b1120' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Package size={14} />
              <span>Products Catalog ({productsSummary.length})</span>
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            {(['7d', '30d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
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

      {/* ========================================================================= */}
      {/* LENS 1: ALL VIDEOS ROLLUP & DRILL-DOWN                                   */}
      {/* ========================================================================= */}
      {activeTab === 'videos' && (
        <>
          {/* Breadcrumb Navigation when viewing a specific Video Drill-Down */}
          {drillDownProjectId ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setDrillDownProjectId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to All Videos</span>
                </button>
                <div style={{ height: '18px', width: '1px', background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Video Deep Dive:</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-teal)' }}>
                  "{currentDrillProject?.name || 'Selected Project'}"
                </span>
              </div>

              {/* Quick switch to another video */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Switch Video:</span>
                <select
                  value={drillDownProjectId}
                  onChange={(e) => setDrillDownProjectId(e.target.value)}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {projectsSummary.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Executive KPI Rollup across ALL videos */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}>
              {/* Card 1: Total Views */}
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
                  <span>Across all {projectsSummary.length || projects.length} library videos</span>
                </div>
              </div>

              {/* Card 2: Total Watch Time */}
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
                  Average viewer completion: 74.2%
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
                  Top quartile interactive conversion
                </div>
              </div>
            </div>
          )}

          {/* If NOT drilled down: Render the All Videos Performance Table */}
          {!drillDownProjectId && (
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              marginBottom: '32px',
              boxShadow: 'var(--shadow-md)',
            }}>
              {/* Search & Table Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                    Video Library Performance (All Projects)
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Click on any video row to drill down into its multi-channel distribution receipt and shoppable telemetry.
                  </p>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '260px' }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search videos..."
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '7px 12px 7px 32px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Videos Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      <th style={{ padding: '12px 14px' }}>Video</th>
                      <th style={{ padding: '12px 14px' }}>Published Channels</th>
                      <th style={{ padding: '12px 14px' }}>Products</th>
                      <th style={{ padding: '12px 14px' }}>Views</th>
                      <th style={{ padding: '12px 14px' }}>Watch Time</th>
                      <th style={{ padding: '12px 14px' }}>Outbound Purchases</th>
                      <th style={{ padding: '12px 14px' }}>QR Scans</th>
                      <th style={{ padding: '12px 14px' }}>Shoppable CTR</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Drill Down</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setDrillDownProjectId(p.id)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Video Name & Thumbnail */}
                        <td style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={p.name}
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '1px solid var(--border-medium)',
                                background: '#000',
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              background: 'rgba(0, 242, 254, 0.1)',
                              border: '1px solid rgba(0, 242, 254, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Film size={20} color="#00F2FE" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              ID: {p.id.slice(0, 14)}... {p.durationSeconds ? `• ${Math.round(p.durationSeconds)}s` : ''}
                            </div>
                          </div>
                        </td>

                        {/* Published Channels Icons */}
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {p.publishedChannels.map((ch) => (
                              <div
                                key={ch}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  borderRadius: '6px',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {getChannelIcon(ch)}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Products Count */}
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(255, 184, 0, 0.1)',
                            color: '#FFB800',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                          }}>
                            <ShoppingCart size={11} />
                            <span>{p.productsCount} {p.productsCount === 1 ? 'item' : 'items'}</span>
                          </span>
                        </td>

                        {/* Views */}
                        <td style={{ padding: '14px', fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                          {p.views.toLocaleString()}
                        </td>

                        {/* Watch Time */}
                        <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>
                          {p.watchTimeHours}h
                        </td>

                        {/* Outbound Clicks */}
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: 'rgba(255, 184, 0, 0.15)',
                            color: '#FFB800',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 800,
                          }}>
                            <ArrowUpRight size={11} />
                            {p.outboundClicks.toLocaleString()}
                          </span>
                        </td>

                        {/* QR Scans */}
                        <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>
                          {p.qrScans.toLocaleString()}
                        </td>

                        {/* CTR % */}
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: p.ctrPercent > 0 ? '#10B981' : 'var(--text-muted)' }}>
                            {p.ctrPercent}%
                          </span>
                        </td>

                        {/* Action Drill Down */}
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrillDownProjectId(p.id);
                            }}
                            style={{
                              background: 'rgba(0, 242, 254, 0.1)',
                              border: '1px solid rgba(0, 242, 254, 0.3)',
                              color: '#00F2FE',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>Drill Down</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* If DRILL DOWN IS ACTIVE: Render Distribution Channels + Video-Level Drawer */}
          {drillDownProjectId && (
            <>
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
                                onClick={() => onNavigateShorts?.(drillDownProjectId)}
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

              {/* Shoppable Products in this video */}
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
                        In-Video Products Telemetry: "{currentDrillProject?.name}"
                      </h2>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Fine-grained telemetry capturing in-player hero drawer impressions, catalog taps, and outbound 1-Click Buy purchase clicks.
                    </p>
                  </div>
                </div>

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
                            style={{ borderBottom: '1px solid var(--border-subtle)' }}
                          >
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
                            <td style={{ padding: '14px', fontSize: '13px', fontWeight: 700, color: '#10B981' }}>
                              ${typeof prod.price === 'number' ? prod.price.toFixed(2) : (prod.price || '0.00')}
                            </td>
                            <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>
                              {prod.inVideoImpressions.toLocaleString()}
                            </td>
                            <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>
                              {prod.catalogExpands.toLocaleString()}
                            </td>
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
                            <td style={{ padding: '14px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: prod.ctrPercent > 0 ? '#10B981' : 'var(--text-muted)' }}>
                                {prod.ctrPercent}%
                              </span>
                            </td>
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
                    padding: '30px 20px',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.15)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      No shoppable product events tracked yet for this project.
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic QR Scan Attribution Diagnostic */}
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
                      /r/{drillDownProjectId}
                    </code>{' '}
                    with auto-injected UTM parameters: <code style={{ color: '#FFB800' }}>?utm_source=digitpop_qr&utm_medium=video_overlay</code>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>● UTM Attribution Active</span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* LENS 2: PRODUCTS CATALOG AGGREGATION & BREAKDOWN BY VIDEO                 */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <>
          {/* Products Rollup Executive KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}>
            {/* Card 1: Total Catalog Products */}
            <div style={{
              background: 'rgba(22, 32, 50, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 184, 0, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFB800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Catalog Products
                </span>
                <Package size={16} color="#FFB800" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {productsSummary.length}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Active in shoppable video circulation
              </div>
            </div>

            {/* Card 2: In-Video Impressions */}
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
                  Total In-Video Impressions
                </span>
                <Eye size={16} color="#00F2FE" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {productsSummary.reduce((acc, p) => acc + p.totalImpressions, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
                Drawer rotations & onscreen hero appearances
              </div>
            </div>

            {/* Card 3: Catalog Expands */}
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
                  Catalog Expands
                </span>
                <Layers size={16} color="#818CF8" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {productsSummary.reduce((acc, p) => acc + p.totalExpands, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Viewer taps to inspect item details
              </div>
            </div>

            {/* Card 4: Total Outbound Purchase Clicks */}
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
                  Outbound Purchase Clicks
                </span>
                <ShoppingCart size={16} color="#FFB800" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {productsSummary.reduce((acc, p) => acc + p.totalOutboundClicks, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#FFB800', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpRight size={12} />
                <span>Direct to Amazon / Store</span>
              </div>
            </div>

            {/* Card 5: Overall Product CTR */}
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
                  Overall Product CTR
                </span>
                <TrendingUp size={16} color="#10B981" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {overview?.overallCtrPercent || 0}%
              </div>
              <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
                Direct purchase intent rate
              </div>
            </div>
          </div>

          {/* Aggregated Products Table with Expandable Video Breakdown */}
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
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  Product Performance Rollup & Video Breakdown
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Aggregated telemetry across all video campaigns. Expand any product row to see the exact video-by-video conversion breakdown.
                </p>
              </div>

              {/* Product Search Bar */}
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '7px 12px 7px 32px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Products Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    <th style={{ padding: '12px 14px' }}>Product</th>
                    <th style={{ padding: '12px 14px' }}>Price</th>
                    <th style={{ padding: '12px 14px' }}>Video Reach</th>
                    <th style={{ padding: '12px 14px' }}>In-Video Impressions</th>
                    <th style={{ padding: '12px 14px' }}>Catalog Expands</th>
                    <th style={{ padding: '12px 14px' }}>Outbound Purchases</th>
                    <th style={{ padding: '12px 14px' }}>Overall CTR</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((prod) => {
                    const isExpanded = expandedProductIds.has(prod.productId);

                    return (
                      <React.Fragment key={prod.productId}>
                        {/* Parent Product Row */}
                        <tr
                          onClick={() => toggleProductExpand(prod.productId)}
                          style={{
                            borderBottom: isExpanded ? 'none' : '1px solid var(--border-subtle)',
                            background: isExpanded ? 'rgba(255, 184, 0, 0.04)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isExpanded) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isExpanded) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {/* Product Image & Title */}
                          <td style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.title}
                                style={{
                                  width: '46px',
                                  height: '46px',
                                  borderRadius: '8px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--border-medium)',
                                  background: '#000',
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '8px',
                                background: 'rgba(255, 184, 0, 0.1)',
                                border: '1px solid rgba(255, 184, 0, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <Package size={20} color="#FFB800" />
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                                {prod.title}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>ID: {prod.productId}</span>
                                {prod.externalUrl && (
                                  <>
                                    <span>•</span>
                                    <a
                                      href={prod.externalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ color: 'var(--accent-teal)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                    >
                                      <span>{prod.externalUrl.includes('amazon') ? 'Amazon Store' : 'Store'}</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td style={{ padding: '14px', fontSize: '13px', fontWeight: 700, color: '#10B981' }}>
                            ${typeof prod.price === 'number' ? prod.price.toFixed(2) : (prod.price || '0.00')}
                          </td>

                          {/* Video Reach */}
                          <td style={{ padding: '14px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(0, 242, 254, 0.1)',
                              color: '#00F2FE',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                            }}>
                              <Film size={11} />
                              <span>{prod.featuredVideosCount} {prod.featuredVideosCount === 1 ? 'video' : 'videos'}</span>
                            </span>
                          </td>

                          {/* In-Video Impressions */}
                          <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>
                            {prod.totalImpressions.toLocaleString()}
                          </td>

                          {/* Catalog Expands */}
                          <td style={{ padding: '14px', fontSize: '13px', fontWeight: 600 }}>
                            {prod.totalExpands.toLocaleString()}
                          </td>

                          {/* Outbound Purchases */}
                          <td style={{ padding: '14px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(255, 184, 0, 0.15)',
                              color: '#FFB800',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12.5px',
                              fontWeight: 800,
                            }}>
                              <ArrowUpRight size={12} />
                              {prod.totalOutboundClicks.toLocaleString()}
                            </span>
                          </td>

                          {/* Overall CTR */}
                          <td style={{ padding: '14px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: prod.overallCtrPercent > 0 ? '#10B981' : 'var(--text-muted)' }}>
                              {prod.overallCtrPercent}%
                            </span>
                          </td>

                          {/* Toggle Expand Button */}
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProductExpand(prod.productId);
                              }}
                              style={{
                                background: isExpanded ? 'rgba(255, 184, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                border: `1px solid ${isExpanded ? '#FFB800' : 'var(--border-subtle)'}`,
                                color: isExpanded ? '#FFB800' : 'var(--text-secondary)',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>{isExpanded ? 'Hide' : 'Breakdown by Video'}</span>
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </button>
                          </td>
                        </tr>

                        {/* Child Expandable Row: Breakdown by Video */}
                        {isExpanded && (
                          <tr style={{ background: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid var(--border-medium)' }}>
                            <td colSpan={8} style={{ padding: '16px 24px 20px 48px' }}>
                              <div style={{
                                background: 'rgba(15, 23, 42, 0.85)',
                                border: '1px solid rgba(255, 184, 0, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '14px 18px',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                  <Film size={14} color="#FFB800" />
                                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                                    Video-by-Video Breakdown for "{prod.title}"
                                  </span>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '10.5px', textTransform: 'uppercase' }}>
                                      <th style={{ padding: '8px 10px' }}>Video Clip</th>
                                      <th style={{ padding: '8px 10px' }}>In-Video Impressions</th>
                                      <th style={{ padding: '8px 10px' }}>Catalog Expands</th>
                                      <th style={{ padding: '8px 10px' }}>Outbound Purchases</th>
                                      <th style={{ padding: '8px 10px' }}>Video CTR</th>
                                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {prod.videos.map((v) => (
                                      <tr key={v.projectId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                        <td style={{ padding: '10px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFB800' }} />
                                          <span>{v.videoTitle}</span>
                                        </td>
                                        <td style={{ padding: '10px' }}>{v.inVideoImpressions.toLocaleString()}</td>
                                        <td style={{ padding: '10px' }}>{v.catalogExpands.toLocaleString()}</td>
                                        <td style={{ padding: '10px', fontWeight: 700, color: '#FFB800' }}>
                                          {v.outboundClickThroughs.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '10px', fontWeight: 700, color: v.ctrPercent > 0 ? '#10B981' : 'var(--text-muted)' }}>
                                          {v.ctrPercent}%
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                          <button
                                            onClick={() => {
                                              setActiveTab('videos');
                                              setDrillDownProjectId(v.projectId);
                                            }}
                                            style={{
                                              background: 'rgba(0, 242, 254, 0.1)',
                                              border: '1px solid rgba(0, 242, 254, 0.3)',
                                              color: '#00F2FE',
                                              padding: '4px 8px',
                                              borderRadius: '4px',
                                              fontSize: '11px',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '3px',
                                            }}
                                          >
                                            <span>View Video Analytics</span>
                                            <ChevronRight size={11} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
