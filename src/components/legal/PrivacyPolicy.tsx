import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, RefreshCw, Trash2, Mail } from 'lucide-react';

interface LegalPageProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<LegalPageProps> = ({ onBack }) => {
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
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #00F2FE, #4FACFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '14px' }}>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)', color: '#00F2FE', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
            <Shield size={13} /> Official Privacy Policy
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px' }}>Privacy Policy</h1>
          <p style={{ fontSize: '15px', color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
            At DigitPop Studio (part of Opportunity OS), we are committed to protecting the privacy, assets, and security of our creators and users. This Privacy Policy details the types of information we collect, how your data is utilized, and your rights regarding social media OAuth permissions.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontSize: '14px', lineHeight: 1.7, color: '#CBD5E1' }}>
          {/* Section 1 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00F2FE' }}>1.</span> Information We Collect
            </h2>
            <p>We collect only the information strictly necessary to deliver our video formatting, interactive overlays, and publishing features:</p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
              <li>
                <strong>Account & Profile Information:</strong> Name, email address, workspace settings, and authentication credentials.
              </li>
              <li>
                <strong>Video Content & Transcripts:</strong> Video files, audio streams, AI-generated transcript words, timestamps, and thumbnail images created in the Studio.
              </li>
              <li>
                <strong>Connected Social Media Accounts (OAuth):</strong> When you connect YouTube or TikTok, we securely store account identifiers (e.g. channel title, creator handle, avatar URL) and OAuth tokens to enable authorized direct video publishing on your behalf.
              </li>
              <li>
                <strong>Shoppable Product Metadata:</strong> Titles, prices, checkout URLs, and product images configured in your project catalog.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00F2FE' }}>2.</span> How We Use Your Information
            </h2>
            <p>Your data is used solely for core platform functionality:</p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
              <li>Processing video speech-to-text transcriptions and generating kinetic vertical subtitle layouts.</li>
              <li>Rendering custom interactive shopping overlays, buy buttons, and dynamic QR codes.</li>
              <li>Publishing your finished shorts directly to your connected YouTube Shorts or TikTok channels upon your explicit request.</li>
              <li>Maintaining your multi-project workspace library and persistent drafts.</li>
            </ul>
            <p>
              <strong style={{ color: '#10B981' }}>Zero Data Selling:</strong> We do not sell, rent, monetize, or trade your personal information, videos, audience data, or social media tokens to data brokers, advertisers, or third parties under any circumstances.
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00F2FE' }}>3.</span> Google & YouTube API Services Compliance
            </h2>
            <p>
              DigitPop Studio's use and transfer of information received from Google APIs will adhere to the{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" style={{ color: '#00F2FE', textDecoration: 'underline' }}>
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
            <p>
              We access YouTube API data strictly to allow you to upload your formatted shorts and set custom high-CTR thumbnails directly to your YouTube channel. You can revoke DigitPop Studio’s access at any time via the{' '}
              <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noreferrer" style={{ color: '#00F2FE', textDecoration: 'underline' }}>
                Google Security Settings page
              </a>.
            </p>
          </section>

          {/* Section 4 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00F2FE' }}>4.</span> TikTok Open API & Creator Data
            </h2>
            <p>
              When connecting your TikTok account via TikTok Login Kit and Content Posting API, we receive basic creator profile details and temporary tokens to perform direct video posting.
            </p>
            <p>
              You can disconnect your TikTok account at any time in the Studio settings or from your TikTok account permissions settings.
            </p>
          </section>

          {/* Section 5 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00F2FE' }}>5.</span> Data Security & Token Storage
            </h2>
            <p>
              All OAuth access and refresh tokens are stored securely in PostgreSQL with industry-standard encryption at rest and TLS 1.3 in transit. We implement strict token expiration lifecycles and automated refresh buffers.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00F2FE' }}>6.</span> Your Rights & Data Deletion
            </h2>
            <p>
              You have the right to request access to, update, or permanently delete your account data, projects, and stored tokens at any time.
            </p>
            <p>
              To request full data deletion or account removal, please email{' '}
              <a href="mailto:support@opportunity-system.com" style={{ color: '#00F2FE', textDecoration: 'none', fontWeight: 600 }}>
                support@opportunity-system.com
              </a>{' '}
              with the subject line "Data Deletion Request". Requests are processed within 48 hours.
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00F2FE' }}>7.</span> Contact Information
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our privacy and security team:
            </p>
            <p style={{ margin: '8px 0', color: '#fff', fontWeight: 600 }}>
              Email: <a href="mailto:support@opportunity-system.com" style={{ color: '#00F2FE', textDecoration: 'none' }}>support@opportunity-system.com</a>
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

export default PrivacyPolicy;
