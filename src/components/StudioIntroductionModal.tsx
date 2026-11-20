import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  ShoppingBag, 
  Layers, 
  ExternalLink, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Compass,
  Target,
  Bot,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StudioIntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreWorkspace?: () => void;
}

export default function StudioIntroductionModal({
  isOpen,
  onClose,
  onExploreWorkspace,
}: StudioIntroductionModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      badge: 'Welcome to DigitPop',
      title: user?.fullName ? `Welcome, ${user.fullName}!` : 'Welcome to DigitPop Studio',
      subtitle: 'Your modern command center for interactive, high-converting shoppable video.',
      icon: <Sparkles className="w-8 h-8 text-amber-400" />,
      content: (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '15px', lineHeight: '1.6', margin: '0 auto 20px', maxWidth: '480px' }}>
            Transform regular videos and streams into immersive shoppable experiences. Viewers can tap products directly in the video, checkout in 1-click, and never leave your stream.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
            <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px 14px', textAlign: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.12)', border: '1px solid rgba(20, 184, 166, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#14b8a6' }}>
                <Target size={18} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc' }}>Interactive Pins</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Frame-accurate hotspots</div>
            </div>
            <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px 14px', textAlign: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#818cf8' }}>
                <Bot size={18} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc' }}>AI Autopilot</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Automatic cue generation</div>
            </div>
            <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px 14px', textAlign: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#f59e0b' }}>
                <Zap size={18} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc' }}>1-Click Checkout</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Seamless product buying</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: 'Step 1: Video & Timeline',
      title: 'Scrub & Tag Moments',
      subtitle: 'Anchor interactive product hotspots directly to visual points on screen.',
      icon: <Play className="w-8 h-8 text-indigo-400" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            Play or scrub your video using the timeline below the media player. At any highlight or product demonstration, tap <strong>Add Hotspot</strong> to link an item at that exact second.
          </p>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 className="w-4 h-4" /> Frame-Accurate Duration & Start Times
            </div>
            <p style={{ color: '#64748b', fontSize: '12px', margin: '6px 0 0 26px' }}>
              Hotspots only appear on screen when the product is actively shown, keeping viewer retention exceptionally high.
            </p>
          </div>
        </div>
      ),
    },
    {
      badge: 'Step 2: Product Basket',
      title: 'Attach Products & Pricing',
      subtitle: 'Manage your product catalog, titles, prices, and direct checkout destinations.',
      icon: <ShoppingBag className="w-8 h-8 text-emerald-400" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            In the right panel, configure the products linked to each hotspot. You can specify discounts, add custom call-to-action buttons, or import collections directly from Shopify or your store.
          </p>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 className="w-4 h-4" /> Multi-Product Baskets & Carousels
            </div>
            <p style={{ color: '#64748b', fontSize: '12px', margin: '6px 0 0 26px' }}>
              Present single spotlight items or rotate full product lookbooks right inside the video frame.
            </p>
          </div>
        </div>
      ),
    },
    {
      badge: 'Step 3: Preview & Launch',
      title: 'Instant Preview & Publishing',
      subtitle: 'Test your interactive video and generate embed codes with one click.',
      icon: <Layers className="w-8 h-8 text-violet-400" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            Click <strong>Deploy & Embed</strong> in the top header to preview how your audience sees it on mobile, tablet, and desktop. Copy the embed code or share the direct link.
          </p>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a78bfa', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 className="w-4 h-4" /> Real-time Analytics & Engagement Tracking
            </div>
            <p style={{ color: '#64748b', fontSize: '12px', margin: '6px 0 0 26px' }}>
              Monitor click-through rates, item additions, and conversions live across all active channels.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleFinish = () => {
    localStorage.setItem('dp_studio_intro_seen', 'true');
    onClose();
    if (onExploreWorkspace) {
      onExploreWorkspace();
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'linear-gradient(145deg, #131b2e, #0d1220)',
          border: '1px solid #23304a',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '24px 28px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {step.icon}
            </div>
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#818cf8',
                  background: 'rgba(99, 102, 241, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  marginBottom: '4px',
                }}
              >
                {step.badge}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {step.title}
              </h2>
            </div>
          </div>
          <button
            onClick={handleFinish}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Skip Introduction"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px 28px', minHeight: '220px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
            {step.subtitle}
          </div>
          {step.content}
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            padding: '18px 28px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Step Dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: idx === currentStep ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentStep ? '#6366f1' : '#334155',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Start Exploring Studio <Compass className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
