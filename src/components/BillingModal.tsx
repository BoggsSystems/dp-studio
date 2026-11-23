import { useState, useEffect } from 'react';
import { X, Check, Zap, CreditCard, ExternalLink, Sparkles, Shield, AlertCircle, HardDrive, Play, Film } from 'lucide-react';
import { api } from '../services/api';

interface BillingModalProps {
  onClose: () => void;
  initialPlan?: 'GROWTH' | 'PRO';
}

export default function BillingModal({ onClose, initialPlan }: BillingModalProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<{
    planTier: string;
    videoCount: number;
    videoLimit: number;
    storageUsedGb: number;
    storageLimitGb: number;
    playsUsed: number;
    playsLimit: number;
    watermark: boolean;
    hasBillingCustomer: boolean;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getSubscriptionStatus().then((data) => {
      if (mounted) setSubscriptionData(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleStartTrial = async (planTier: 'GROWTH' | 'PRO') => {
    setLoadingPlan(planTier);
    setErrorMsg(null);
    try {
      const res = await api.createCheckoutSession(planTier, billingInterval);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not start checkout session. Please try again.');
      setLoadingPlan(null);
    }
  };

  const handleOpenPortal = async () => {
    setLoadingPortal(true);
    setErrorMsg(null);
    try {
      const res = await api.createPortalSession();
      if (res.portalUrl) {
        window.location.href = res.portalUrl;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load customer billing portal.');
      setLoadingPortal(false);
    }
  };

  const currentTier = subscriptionData?.planTier || 'FREE_TRIAL';
  const videoCount = subscriptionData?.videoCount || 0;
  const videoLimit = subscriptionData?.videoLimit || 5;
  const storageUsedGb = subscriptionData?.storageUsedGb || 0;
  const storageLimitGb = subscriptionData?.storageLimitGb || 10;
  const playsUsed = subscriptionData?.playsUsed || 0;
  const playsLimit = subscriptionData?.playsLimit || 1000;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '95%',
          background: 'var(--bg-secondary, #111827)',
          border: '1px solid var(--border-color, #1f2937)',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #1f2937)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              SV
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f3f4f6' }}>
                Subscription & Plan Management
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                ShopVideo.tv • Active Plan: <strong style={{ color: '#38bdf8' }}>{currentTier.replace('_', ' ')}</strong>
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {/* Quota & Usage Bar */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Plan Quota & Resource Usage
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f9fafb', marginTop: '2px' }}>
                  {currentTier.replace('_', ' ')} Allocation
                </div>
              </div>

              {subscriptionData?.hasBillingCustomer && (
                <button
                  className="btn btn-secondary"
                  onClick={handleOpenPortal}
                  disabled={loadingPortal}
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CreditCard size={14} />
                  {loadingPortal ? 'Opening Portal...' : 'Manage Invoices & Cards'}
                  <ExternalLink size={12} />
                </button>
              )}
            </div>

            {/* 3-Metric Resource Meters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
              {/* Metric 1: Hosted Videos */}
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Film size={12} color="#38bdf8" /> Hosted Videos
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#f3f4f6' }}>
                    {videoCount} / {videoLimit}
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round((videoCount / videoLimit) * 100))}%`,
                      background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Metric 2: Cloud Storage */}
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <HardDrive size={12} color="#10b981" /> Storage Quota
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#f3f4f6' }}>
                    {storageUsedGb} / {storageLimitGb} GB
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round((storageUsedGb / storageLimitGb) * 100))}%`,
                      background: 'linear-gradient(90deg, #059669, #10b981)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Metric 3: Monthly Plays */}
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Play size={12} color="#f59e0b" /> Monthly Plays
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#f3f4f6' }}>
                    {playsUsed.toLocaleString()} / {playsLimit.toLocaleString()}
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round((playsUsed / playsLimit) * 100))}%`,
                      background: 'linear-gradient(90deg, #d97706, #f59e0b)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly / Annual Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <button
                onClick={() => setBillingInterval('month')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: billingInterval === 'month' ? 'var(--accent-blue, #0284c7)' : 'transparent',
                  color: billingInterval === 'month' ? '#fff' : '#9ca3af',
                  transition: 'all 0.2s',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: billingInterval === 'year' ? 'var(--accent-blue, #0284c7)' : 'transparent',
                  color: billingInterval === 'year' ? '#fff' : '#9ca3af',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Annual Billing
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(56, 189, 248, 0.25)',
                    color: '#38bdf8',
                  }}
                >
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Growth Tier */}
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: currentTier === 'GROWTH' ? 'rgba(2, 132, 199, 0.08)' : 'rgba(255,255,255,0.02)',
                border: currentTier === 'GROWTH' ? '2px solid #0284c7' : '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Growth</h4>
                  {currentTier === 'GROWTH' && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#0284c7', color: '#fff' }}>
                      Current Plan
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#f3f4f6' }}>
                    ${billingInterval === 'year' ? '39' : '49'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>/ month</span>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 16px' }}>
                  Ideal for growing Shopify brands and direct-to-consumer creators.
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="#38bdf8" /> 15,000 active plays / mo
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="#38bdf8" /> Up to 50 hosted videos
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="#38bdf8" /> ShopVideo Watermark Removed
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="#38bdf8" /> Split-Panel Product Rail
                  </li>
                </ul>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => handleStartTrial('GROWTH')}
                disabled={loadingPlan === 'GROWTH' || currentTier === 'GROWTH'}
                style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
              >
                {currentTier === 'GROWTH'
                  ? 'Active Plan'
                  : loadingPlan === 'GROWTH'
                  ? 'Redirecting to Checkout...'
                  : 'Start 14-Day Free Trial'}
              </button>
            </div>

            {/* Scale / Pro Tier */}
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: currentTier === 'PRO' ? 'rgba(2, 132, 199, 0.08)' : 'rgba(255,255,255,0.02)',
                border: currentTier === 'PRO' ? '2px solid #0284c7' : '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Scale / Pro</h4>
                  {currentTier === 'PRO' && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#0284c7', color: '#fff' }}>
                      Current Plan
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#f3f4f6' }}>
                    ${billingInterval === 'year' ? '149' : '179'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>/ month</span>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 16px' }}>
                  For high-velocity e-commerce brands and multi-channel creators.
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="#38bdf8" /> 75,000 active plays / mo
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="#38bdf8" /> Up to 250 hosted videos
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="#38bdf8" /> Unlimited Live Broadcasts
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="#38bdf8" /> AI Product Catalog Auto-Sync
                  </li>
                </ul>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => handleStartTrial('PRO')}
                disabled={loadingPlan === 'PRO' || currentTier === 'PRO'}
                style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
              >
                {currentTier === 'PRO'
                  ? 'Active Plan'
                  : loadingPlan === 'PRO'
                  ? 'Redirecting to Checkout...'
                  : 'Start 14-Day Free Trial'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
