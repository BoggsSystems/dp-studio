import React, { useState } from 'react';
import {
  Play,
  Zap,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  Radio,
  Sliders,
  Tv,
  Globe,
  Database,
  Lock,
  Flame,
} from 'lucide-react';
import { siteConfig, PricingTier } from '../../config/siteConfig';

interface LandingPageProps {
  onGetStarted: (planId?: string) => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showFullComparison, setShowFullComparison] = useState(false);
  const [activeDemoMode, setActiveDemoMode] = useState<'desktop' | 'mobile'>('desktop');

  const demoProjectId = '6dc1e1f7-ffaa-4755-b283-0d098d122b78';
  const playerBase = siteConfig.brand.playerCdnUrl;
  const demoUrl = `${playerBase}/?projectId=${demoProjectId}&theme=dark`;

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. STICKY NAVIGATION BAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(10, 14, 23, 0.85)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '14px 28px',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-teal))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Play size={18} fill="#ffffff" color="#ffffff" style={{ marginLeft: '2px' }} />
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                {siteConfig.brand.name}
              </span>
              <span style={{ fontSize: '10px', marginLeft: '6px', padding: '2px 6px', background: 'rgba(37, 99, 235, 0.15)', color: 'var(--accent-teal)', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.25)', fontWeight: 600 }}>
                VIDEO PLATFORM
              </span>
            </div>
          </div>

          {/* Navigation Anchors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '26px' }} className="landing-nav-links">
            <a href="#demo" style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}>
              Interactive Demo
            </a>
            <a href="#features" style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}>
              Features
            </a>
            <a href="#pricing" style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}>
              Pricing
            </a>
            <a href="#specs" style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}>
              Tech Specs
            </a>
            <a href="#faq" style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}>
              FAQ
            </a>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onSignIn}
              className="btn btn-ghost"
              style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '6px 14px' }}
            >
              Sign In
            </button>
            <button
              onClick={() => onGetStarted('growth')}
              className="btn btn-primary"
              style={{
                fontSize: '13px',
                padding: '8px 16px',
                fontWeight: 600,
                boxShadow: '0 0 16px rgba(37, 99, 235, 0.35)',
              }}
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. HERO SECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'relative',
          padding: '80px 24px 60px',
          textAlign: 'center',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {/* Glow ambient circle */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '350px',
            background: 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.18), transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Pill Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-teal)',
              marginBottom: '24px',
            }}
          >
            <Sparkles size={14} />
            <span>Next-Gen Video Hosting & Interactive Commerce</span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: 'clamp(36px, 5.5vw, 62px)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              marginBottom: '22px',
            }}
          >
            Turn Any Video Into An{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #60a5fa 20%, #2dd4bf 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Interactive 1-Click Storefront
            </span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '820px',
              margin: '0 auto 36px',
            }}
          >
            {siteConfig.brand.subheadline}
          </p>

          {/* CTA Group */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '40px' }}>
            <button
              onClick={() => onGetStarted('growth')}
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: '0 0 24px rgba(37, 99, 235, 0.5)',
                gap: '8px',
              }}
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="#demo"
              className="btn btn-secondary"
              style={{
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                gap: '8px',
              }}
            >
              <Play size={15} fill="currentColor" />
              <span>Watch Live Demo</span>
            </a>
          </div>

          {/* Trust Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {siteConfig.trustBadges.map((badge, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Check size={14} color="var(--status-online)" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PERFORMANCE STATS BANNER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', textAlign: 'center' }}>
          {siteConfig.stats.map((stat, idx) => (
            <div key={idx}>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '4px',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. INTERACTIVE LIVE DEMO SECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="demo" style={{ padding: '80px 24px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Experience The Player
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Interactive Demo: Click to Play & Shop
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '640px', margin: '0 auto' }}>
            See how Timeline Pins trigger product drawers, the Split-Panel Co-Pilot Rail keeps viewing uninterrupted, and viewers can checkout natively without leaving the video.
          </p>

          {/* Device Toggle */}
          <div style={{ display: 'inline-flex', padding: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', marginTop: '20px' }}>
            <button
              onClick={() => setActiveDemoMode('desktop')}
              className={`btn ${activeDemoMode === 'desktop' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Desktop 16:9 View
            </button>
            <button
              onClick={() => setActiveDemoMode('mobile')}
              className={`btn ${activeDemoMode === 'mobile' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Mobile Drawer View
            </button>
          </div>
        </div>

        {/* Demo Frame */}
        <div
          style={{
            maxWidth: activeDemoMode === 'desktop' ? '980px' : '420px',
            margin: '0 auto',
            transition: 'max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(37, 99, 235, 0.15)',
          }}
        >
          {/* Mock Browser Header */}
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(15, 23, 42, 0.8)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            </div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '3px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              https://yourstore.com/watch-and-shop
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--status-online)', fontWeight: 600 }}>LIVE DEMO</span>
            </div>
          </div>

          {/* Embedded Player iframe */}
          <div style={{ width: '100%', aspectRatio: activeDemoMode === 'desktop' ? '16/9' : '9/16', position: 'relative', background: '#000000' }}>
            <iframe
              src={demoUrl}
              title="DigitPop Interactive Shoppable Video Demo"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Feature Highlights Grid Below Demo */}
        <div style={{ maxWidth: '980px', margin: '32px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            { title: 'Timeline Pins & Drawers', desc: 'Synchronized product drops appear right as items appear on screen.', icon: Layers },
            { title: 'Split-Panel Co-Pilot', desc: 'Allows viewers to browse specs and variants without covering the video.', icon: Tv },
            { title: 'Freeze-Frame Inspect', desc: 'Pausing the video reveals high-res product inspection tags automatically.', icon: Sliders },
            { title: '1-Click Stripe Cart', desc: 'Direct in-video checkout or automatic redirection to your Shopify cart.', icon: CreditCard },
          ].map((item, idx) => (
            <div key={idx} style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <item.icon size={16} color="var(--accent-teal)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. CORE PLATFORM PILLARS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 24px', background: 'rgba(15, 23, 42, 0.3)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Why DigitPop
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
              The Complete Video Hosting & Commerce Stack
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
              Replace your generic video host and third-party shopping widgets with a unified, high-performance engine built for conversion.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            {[
              {
                icon: Zap,
                title: 'Ultra-Fast Edge Hosting',
                desc: 'Multi-bitrate HLS streaming delivered via Cloudflare Stream & R2 global points of presence. Sub-30ms cold-start, instant seek, and 0 egress fees.',
                badge: 'Infrastructure',
              },
              {
                icon: ShoppingBag,
                title: 'Interactive Commerce Rails',
                desc: 'Frame-accurate timeline pins, animated product drawers, and variant selectors. Keep 100% of your sales with 0% platform commission.',
                badge: 'Shoppable UX',
              },
              {
                icon: Globe,
                title: 'Universal 1-Line Embed',
                desc: 'Embed on Shopify, WooCommerce, Webflow, Squarespace, WordPress, or custom React storefronts with a single lightweight script tag.',
                badge: 'Distribution',
              },
              {
                icon: Radio,
                title: 'Live Shopping Studio',
                desc: 'Broadcast live shopping drops straight from your browser or OBS with real-time product pin drops and multi-channel RTMP relays.',
                badge: 'Live Broadcast',
              },
            ].map((pillar, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(37, 99, 235, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <pillar.icon size={20} color="var(--accent-teal)" />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, background: 'rgba(255, 255, 255, 0.04)', padding: '3px 8px', borderRadius: '4px' }}>
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {pillar.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. INTERACTIVE PRICING & PLAN COMPARISON */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '90px 24px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Transparent Pricing
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Fair Plans Built Around Active Engagement
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '640px', margin: '0 auto 24px' }}>
            Never pay for ignored video widgets or passive impressions. Only pay when shoppers actively watch your videos.
          </p>

          {/* Billing Frequency Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '999px' }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '6px 18px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: billingCycle === 'monthly' ? 'var(--accent-blue)' : 'transparent',
                color: billingCycle === 'monthly' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '6px 18px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: billingCycle === 'annual' ? 'var(--accent-blue)' : 'transparent',
                color: billingCycle === 'annual' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Annual Billing</span>
              <span style={{ fontSize: '10px', background: 'var(--status-online)', color: '#000000', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'stretch', marginBottom: '40px' }}>
          {siteConfig.pricingTiers.map((tier) => {
            const price = billingCycle === 'annual' ? tier.priceAnnual : tier.priceMonthly;
            const isPopular = tier.popular;

            return (
              <div
                key={tier.id}
                style={{
                  background: isPopular ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-surface)',
                  border: isPopular ? '2px solid var(--accent-blue)' : '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  boxShadow: isPopular ? '0 16px 40px rgba(37, 99, 235, 0.25)' : 'none',
                }}
              >
                {/* Popular Pill */}
                {tier.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: isPopular ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-teal))' : 'var(--border-medium)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 12px',
                      borderRadius: '999px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tier.badge}
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {tier.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', minHeight: '36px', marginBottom: '18px' }}>
                    {tier.tagline}
                  </p>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
                      ${price}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      / month {billingCycle === 'annual' && price > 0 ? '(billed annually)' : ''}
                    </span>
                  </div>

                  {/* Quota Highlights */}
                  <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-teal-light)', marginBottom: '4px' }}>
                      🎯 {tier.playsPerMonth}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      📁 {tier.hostedVideos} • ⚡ {tier.storage}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      📡 {tier.liveStreaming}
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {tier.features.map((feat, fIdx) => (
                      <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <Check size={14} color="var(--status-online)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <button
                  onClick={() => onGetStarted(tier.id)}
                  className={`btn ${tier.buttonVariant === 'primary' ? 'btn-primary' : tier.buttonVariant === 'secondary' ? 'btn-secondary' : 'btn-outline'}`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: isPopular ? '0 0 20px rgba(37, 99, 235, 0.4)' : 'none',
                  }}
                >
                  {tier.ctaText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Transparent Overage Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(45, 212, 191, 0.08))',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            marginBottom: '40px',
          }}
        >
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Flame size={18} color="var(--status-warning)" />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                Viral Spike Protection & Flat Overages
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {siteConfig.overagePolicy.guarantee}
            </p>
          </div>
          <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-teal)' }}>
              {siteConfig.overagePolicy.rate}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Just {siteConfig.overagePolicy.costPerPlay} per extra active play (50%+ cheaper than competition)
            </div>
          </div>
        </div>

        {/* Full Feature Comparison Toggle */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setShowFullComparison(!showFullComparison)}
            className="btn btn-secondary"
            style={{ fontSize: '13px', gap: '8px', padding: '10px 20px' }}
          >
            <span>{showFullComparison ? 'Hide Detailed Feature Comparison' : 'View Full Feature Comparison Matrix'}</span>
            {showFullComparison ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Detailed Feature Comparison Table */}
        {showFullComparison && (
          <div
            style={{
              marginTop: '28px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', background: 'rgba(0, 0, 0, 0.2)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-primary)', width: '36%' }}>Feature</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', width: '16%' }}>Free Trial</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--accent-teal)', textAlign: 'center', width: '16%' }}>Growth</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: '#93c5fd', textAlign: 'center', width: '16%' }}>Scale / Pro</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', width: '16%' }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {siteConfig.comparisonMatrix.map((row, rIdx) => {
                  const renderVal = (val: any) => {
                    if (val === true) return <Check size={16} color="var(--status-online)" style={{ margin: '0 auto' }} />;
                    if (val === false) return <X size={16} color="var(--text-muted)" style={{ margin: '0 auto' }} />;
                    return <span style={{ fontWeight: 600 }}>{val}</span>;
                  };

                  return (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                      }}
                    >
                      <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                          {row.category}
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{row.feature}</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{renderVal(row.free)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent-teal)' }}>{renderVal(row.growth)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#93c5fd' }}>{renderVal(row.pro)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-primary)' }}>{renderVal(row.enterprise)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. TECHNICAL HOSTING SPECS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="specs" style={{ padding: '80px 24px', background: 'rgba(15, 23, 42, 0.4)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Hosting Architecture
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
              Built for Scale, Speed & Zero Egress
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '640px', margin: '0 auto' }}>
              Powered by Cloudflare global edge infrastructure to deliver instant playback to shoppers anywhere in the world.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              {
                icon: Database,
                title: 'Adaptive Bitrate Streaming',
                desc: 'Automatic HLS encoding generates 1080p, 720p, and 480p streams tailored to the viewer\'s network speed for 0 buffering.',
              },
              {
                icon: Globe,
                title: '300+ Global Edge Locations',
                desc: 'Edge caching ensures video manifests and catalog overlays resolve with <30ms latency, keeping mobile bounce rates near zero.',
              },
              {
                icon: Lock,
                title: 'Frame-Accurate Metadata Sync',
                desc: 'Sub-second synchronization between video timestamps and product availability states ensures viewers never buy out-of-stock items.',
              },
            ].map((spec, sIdx) => (
              <div key={sIdx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                <spec.icon size={22} color="var(--accent-teal)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{spec.title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{spec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: '80px 24px', maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Questions & Answers
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {siteConfig.faq.map((item, fIdx) => {
            const isExpanded = expandedFaq === fIdx;

            return (
              <div
                key={fIdx}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  onClick={() => toggleFaq(fIdx)}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span>{item.question}</span>
                  {isExpanded ? <ChevronUp size={16} color="var(--accent-teal)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </button>
                {isExpanded && (
                  <div style={{ padding: '0 20px 20px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. BOTTOM CTA BANNER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.2), transparent 70%)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Ready to Transform Your Video Content Into Revenue?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
            Launch your first interactive shoppable video in under 5 minutes. No credit card required.
          </p>
          <button
            onClick={() => onGetStarted('growth')}
            className="btn btn-primary"
            style={{
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 700,
              boxShadow: '0 0 30px rgba(37, 99, 235, 0.6)',
              gap: '8px',
            }}
          >
            <span>Start Your 14-Day Free Trial</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 10. FOOTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '40px 24px 30px', background: 'rgba(10, 14, 23, 0.95)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-teal))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play size={14} fill="#ffffff" color="#ffffff" style={{ marginLeft: '1px' }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
              {siteConfig.brand.name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
              © {new Date().getFullYear()} Boggs Systems Corporation. All rights reserved.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Terms of Service
            </a>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Privacy Policy
            </a>
            <a href={`mailto:${siteConfig.brand.supportEmail}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Support
            </a>
            <button
              onClick={onSignIn}
              style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', cursor: 'pointer', padding: 0, fontSize: '12px' }}
            >
              Creator Studio Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
