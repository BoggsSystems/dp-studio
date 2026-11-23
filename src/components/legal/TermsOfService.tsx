import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

interface LegalPageProps {
  onBack?: () => void;
}

export const TermsOfService: React.FC<LegalPageProps> = ({ onBack }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#E2E8F0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Navigation Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, padding: '16px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onBack ? (
              <button
                onClick={onBack}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={14} /> Back to Studio
              </button>
            ) : (
              <a
                href="/"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={14} /> Back to Studio
              </a>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '13px' }}>
                SV
              </div>
              <span style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>ShopVideo.tv</span>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>Last Updated: November 23, 2026</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
            <FileText size={13} /> Official Terms of Service
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px' }}>Terms of Service</h1>
          <p style={{ fontSize: '15px', color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
            Welcome to ShopVideo.tv (operated by DigitPop / Opportunity OS, accessible at shopvideo.tv, studio.shopvideo.tv, and digitpop.opportunity-system.com). Please read these Terms of Service carefully before utilizing our video hosting, interactive overlays, player embed technology, and cloud rendering services.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontSize: '14px', lineHeight: 1.7, color: '#CBD5E1' }}>
          {/* Section 1 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38bdf8' }}>1.</span> Acceptance of Terms
            </h2>
            <p>
              By creating an account, accepting an invitation, or accessing ShopVideo.tv, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38bdf8' }}>2.</span> Platform Services & Creator Rights
            </h2>
            <p>
              ShopVideo.tv provides creators, e-commerce brands, and publishers with cloud software tools for:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
              <li>Hosting, transcoding, and streaming ultra-fast shoppable videos with responsive embed players.</li>
              <li>Embedding interactive product hotspots, multi-tier product baskets, and dynamic checkout overlays.</li>
              <li>Generating kinetic AI subtitles, vertical 9:16 aspect ratio formatting, and multi-channel publishing.</li>
            </ul>
            <p>
              <strong style={{ color: '#10B981' }}>Creator Ownership:</strong> You retain 100% intellectual property ownership of all videos, audio recordings, product imagery, and transcripts uploaded or created through your ShopVideo account.
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38bdf8' }}>3.</span> Subscriptions, 14-Day Free Trial & Cancellation
            </h2>
            <p>
              ShopVideo offers recurring subscription plans (Growth, Pro, and Enterprise) billed monthly or annually.
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
              <li>
                <strong>14-Day Free Trial:</strong> Paid plan trials require a valid payment method upon signup but are billed $0.00 during the first 14 days.
              </li>
              <li>
                <strong>Self-Serve Cancellation:</strong> You may cancel your subscription at any time directly through the Studio by accessing the Billing Customer Portal.
              </li>
              <li>
                <strong>Zero Unwanted Charges:</strong> If you cancel on or prior to Day 14 of your free trial, your account will be immediately downgraded without any charges to your card.
              </li>
              <li>
                <strong>Content Retention:</strong> Downgrading or cancelling preserves your existing video drafts and projects. Free tier accounts are subject to free plan limits (5 hosted videos, watermark enabled).
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38bdf8' }}>4.</span> Social Media Integrations & Third-Party APIs
            </h2>
            <p>
              ShopVideo allows creators to connect third-party platforms via OAuth 2.0. By connecting your accounts, you acknowledge and agree to the following third-party terms:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
              <li>
                <strong>YouTube API Services:</strong> ShopVideo uses YouTube API Services. By connecting YouTube, you agree to be bound by the{' '}
                <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                  YouTube Terms of Service
                </a>{' '}
                and the{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                  Google Privacy Policy
                </a>.
              </li>
              <li>
                <strong>TikTok Open API / Login Kit:</strong> By connecting TikTok, you agree to abide by the{' '}
                <a href="https://www.tiktok.com/legal/terms-of-service" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                  TikTok Terms of Service
                </a>.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38bdf8' }}>5.</span> Acceptable Use Policy
            </h2>
            <p>You agree not to use ShopVideo to upload, host, stream, or distribute:</p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
              <li>Content that infringes on third-party intellectual property, copyrights, or trademarks.</li>
              <li>Deceptive, fraudulent, counterfeit, defamatory, or unlawful merchandise or media.</li>
              <li>Malicious software, exploits, automated scrapers, or abusive traffic loads targeting our video CDN.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38bdf8' }}>6.</span> Limitation of Liability & Disclaimers
            </h2>
            <p>
              ShopVideo.tv and Opportunity OS provide cloud services on an "as is" and "as available" basis. While we maintain 99.9% streaming availability, we are not liable for third-party payment gateway failures, merchant delivery disputes, or social network API changes.
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38bdf8' }}>7.</span> Contact & Legal Notice
            </h2>
            <p>
              For legal inquiries, billing assistance, or questions regarding these Terms of Service, please contact:
            </p>
            <p style={{ margin: '8px 0', color: '#fff', fontWeight: 600 }}>
              Email: <a href="mailto:support@opportunity-system.com" style={{ color: '#38bdf8', textDecoration: 'none' }}>support@opportunity-system.com</a>
            </p>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px' }}>
              ShopVideo.tv &bull; DigitPop &bull; Opportunity OS &bull; United States
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
