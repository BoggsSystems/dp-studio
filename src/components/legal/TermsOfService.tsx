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
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #FFB800, #FF334B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '14px' }}>
                DP
              </div>
              <span style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>DigitPop Studio</span>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>Last Updated: September 18, 2026</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)', color: '#FFB800', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
            <FileText size={13} /> Official Terms of Service
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px' }}>Terms of Service</h1>
          <p style={{ fontSize: '15px', color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
            Welcome to DigitPop Studio (operated by Opportunity OS, accessible at opportunity-system.com and digitpop.opportunity-system.com). Please read these Terms of Service carefully before utilizing our video formatting, AI subtitling, shoppable interactive overlays, and multi-channel publishing platforms.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontSize: '14px', lineHeight: 1.7, color: '#CBD5E1' }}>
          {/* Section 1 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#FFB800' }}>1.</span> Acceptance of Terms
            </h2>
            <p>
              By accessing or using DigitPop Studio, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#FFB800' }}>2.</span> Platform Services & Creator Rights
            </h2>
            <p>
              DigitPop Studio provides creators, businesses, and developers with software tools for:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
              <li>Formatting long-form and horizontal videos into 9:16 vertical AI shorts with dynamic kinetic subtitles.</li>
              <li>Embedding interactive shoppable drawers, buy buttons, and dynamic QR code overlays.</li>
              <li>Publishing video content directly to connected social media platforms including YouTube Shorts and TikTok.</li>
            </ul>
            <p>
              <strong style={{ color: '#10B981' }}>Content Ownership:</strong> You retain 100% intellectual property ownership of all videos, audio recordings, product imagery, and transcripts uploaded or generated through your DigitPop Studio account.
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#FFB800' }}>3.</span> Social Media Integrations & Third-Party APIs
            </h2>
            <p>
              DigitPop Studio allows creators to connect third-party accounts via OAuth 2.0. By connecting your accounts, you acknowledge and agree to the following third-party terms:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
              <li>
                <strong>YouTube API Services:</strong> DigitPop Studio uses YouTube API Services. By connecting YouTube, you agree to be bound by the{' '}
                <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" style={{ color: '#00F2FE', textDecoration: 'underline' }}>
                  YouTube Terms of Service
                </a>{' '}
                and the{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{ color: '#00F2FE', textDecoration: 'underline' }}>
                  Google Privacy Policy
                </a>.
              </li>
              <li>
                <strong>TikTok Open API / Login Kit:</strong> By connecting your TikTok creator account, you agree to abide by the{' '}
                <a href="https://www.tiktok.com/legal/terms-of-service" target="_blank" rel="noreferrer" style={{ color: '#00F2FE', textDecoration: 'underline' }}>
                  TikTok Terms of Service
                </a>{' '}
                and TikTok Developer Community Guidelines.
              </li>
            </ul>
            <p>
              You may revoke DigitPop Studio's access to your social media accounts at any time through our studio settings or via your Google and TikTok security permission consoles.
            </p>
          </section>

          {/* Section 4 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#FFB800' }}>4.</span> Acceptable Use Policy
            </h2>
            <p>You agree not to use DigitPop Studio to upload, generate, or distribute:</p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
              <li>Content that infringes on third-party intellectual property, copyrights, or trademarks.</li>
              <li>Harmful, deceptive, fraudulent, defamatory, or unlawful material.</li>
              <li>Malicious code, exploits, or automated scraping scripts targeting our rendering pipelines.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#FFB800' }}>5.</span> Limitation of Liability & Disclaimers
            </h2>
            <p>
              DigitPop Studio and Opportunity OS provide software services on an "as is" and "as available" basis without warranties of any kind. We are not liable for third-party social media platform downtime, API deprecations, or content moderation actions taken by third-party social networks.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#FFB800' }}>6.</span> Contact & Legal Notice
            </h2>
            <p>
              For legal inquiries, support, or questions regarding these Terms of Service, please reach out to us:
            </p>
            <p style={{ margin: '8px 0', color: '#fff', fontWeight: 600 }}>
              Email: <a href="mailto:support@opportunity-system.com" style={{ color: '#FFB800', textDecoration: 'none' }}>support@opportunity-system.com</a>
            </p>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px' }}>
              Opportunity OS &bull; DigitPop Studio &bull; United States
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
