import React, { useState } from 'react';
import { Plus, Target, DollarSign, Award, TrendingUp, HelpCircle, CheckCircle, Clock } from 'lucide-react';
import { Campaign, Project } from '../types';
import CampaignWizard from './CampaignWizard';

interface CampaignListProps {
  campaigns: Campaign[];
  projects: Project[];
  onCampaignCreated: (campaign: Campaign) => void;
}

export default function CampaignList({ campaigns, projects, onCampaignCreated }: CampaignListProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  const totalSpend = campaigns.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const avgRecall = campaigns.length > 0
    ? (campaigns.reduce((acc, c) => acc + (c.brandRecallRate || 0), 0) / campaigns.length).toFixed(1)
    : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="surface-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Ad Spend
            </span>
            <DollarSign size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 600 }}>
            ● Dynamic PopCoin Payouts
          </div>
        </div>

        <div className="surface-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Campaigns
            </span>
            <Target size={16} color="var(--accent-teal)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            {activeCount} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {campaigns.length} total</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-teal)', marginTop: '4px', fontWeight: 600 }}>
            ● Running across video network
          </div>
        </div>

        <div className="surface-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Verified Impressions
            </span>
            <TrendingUp size={16} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            {totalImpressions.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-blue)', marginTop: '4px', fontWeight: 600 }}>
            ● Sub-second token delivery
          </div>
        </div>

        <div className="surface-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Avg Brand Recall
            </span>
            <Award size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            {avgRecall}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-amber)', marginTop: '4px', fontWeight: 600 }}>
            ● Via proof-of-attention quizzes
          </div>
        </div>
      </div>

      {/* Main Campaign List Panel */}
      <div className="surface-panel">
        <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="var(--accent-teal)" />
              <span>Enterprise Ad Campaigns</span>
            </div>
            <div className="panel-desc">
              Manage proof-of-attention sponsorship budgets, video placements, and viewer engagement verification.
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsWizardOpen(true)}
          >
            <Plus size={16} />
            <span>Create Campaign</span>
          </button>
        </div>

        {/* Campaign Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {campaigns.map((camp) => {
            const isExpanded = expandedCampaignId === camp.id;
            const spentPercent = camp.budgetAmount > 0
              ? Math.min(100, Math.round(((camp.totalSpent || 0) / camp.budgetAmount) * 100))
              : 0;

            return (
              <div
                key={camp.id}
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {camp.name}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background:
                            camp.status === 'ACTIVE'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(148, 163, 184, 0.15)',
                          color:
                            camp.status === 'ACTIVE'
                              ? 'var(--accent-emerald)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {camp.status}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(20, 184, 166, 0.1)',
                          color: 'var(--accent-teal)',
                        }}
                      >
                        {camp.biddingModel === 'COMPREHENSION' ? 'Proof of Attention' : camp.biddingModel}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px', marginTop: '2px' }}>
                      <span>Category: <strong style={{ color: 'var(--text-secondary)' }}>{camp.category}</strong></span>
                      {camp.projectName && (
                        <span>Linked Project: <strong style={{ color: 'var(--accent-blue)' }}>{camp.projectName}</strong></span>
                      )}
                      <span>Flight: <strong style={{ color: 'var(--text-secondary)' }}>{camp.startDate}</strong> to <strong style={{ color: 'var(--text-secondary)' }}>{camp.endDate}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => setExpandedCampaignId(isExpanded ? null : camp.id)}
                  >
                    <HelpCircle size={13} />
                    <span>{isExpanded ? 'Hide Quiz' : 'View Quiz'}</span>
                  </button>
                </div>

                {/* Budget Progress Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Budget Spent: <strong style={{ color: 'var(--text-primary)' }}>${(camp.totalSpent || 0).toFixed(2)}</strong> of ${camp.budgetAmount.toFixed(2)}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                      {spentPercent}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${spentPercent}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--accent-teal), var(--accent-emerald))',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>

                {/* Performance Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Impressions</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {(camp.impressions || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hotspot Clicks</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {(camp.clicks || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Brand Recall Rate</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {camp.brandRecallRate || 0}%
                    </div>
                  </div>
                </div>

                {/* Expanded Quiz Verification Details */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-teal)' }}>
                      PROOF-OF-ATTENTION COMPREHENSION QUIZ
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {camp.verificationQuestion}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {camp.verificationOptions.map((opt, oIdx) => {
                        const isCorrect = camp.correctOptionIndex === oIdx;
                        return (
                          <div
                            key={oIdx}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-canvas)',
                              border: `1px solid ${isCorrect ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                              fontSize: '12px',
                              color: isCorrect ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                              fontWeight: isCorrect ? 600 : 400,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                            {isCorrect && <CheckCircle size={13} style={{ marginLeft: 'auto' }} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign Creation Wizard Modal */}
      <CampaignWizard
        projects={projects}
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreated={(newCamp) => {
          onCampaignCreated(newCamp);
        }}
      />
    </div>
  );
}
