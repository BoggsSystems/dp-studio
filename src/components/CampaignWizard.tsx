import React, { useState } from 'react';
import { X, DollarSign, Calendar, Target, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Campaign, Project } from '../types';
import { api } from '../services/api';

interface CampaignWizardProps {
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: (campaign: Campaign) => void;
}

export default function CampaignWizard({ projects, isOpen, onClose, onCreated }: CampaignWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [category, setCategory] = useState('Software & Technology');
  const [budgetAmount, setBudgetAmount] = useState<number>(1000);
  const [dailyBudgetLimit, setDailyBudgetLimit] = useState<number>(100);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [biddingModel, setBiddingModel] = useState<'CPM' | 'CPC' | 'COMPREHENSION'>('COMPREHENSION');
  const [verificationQuestion, setVerificationQuestion] = useState(
    'What key feature was demonstrated in this interactive showcase?'
  );
  const [verificationOptions, setVerificationOptions] = useState<string[]>([
    'Instant 10ms Autofill & Execution',
    'Standard Manual Entry',
    '3-5 Business Day Processing',
    'Third-party external redirects',
  ]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...verificationOptions];
    updated[index] = val;
    setVerificationOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Campaign name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedProj = projects.find((p) => p.id === selectedProjectId);
      const newCampaignData: Partial<Campaign> = {
        name,
        projectId: selectedProjectId || undefined,
        projectName: selectedProj?.name,
        category,
        budgetAmount: Number(budgetAmount),
        dailyBudgetLimit: Number(dailyBudgetLimit),
        startDate,
        endDate,
        biddingModel,
        verificationQuestion,
        verificationOptions,
        correctOptionIndex,
        status: 'ACTIVE',
      };

      const created = await api.createCampaign(newCampaignData);
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="surface-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Create Brand Ad Campaign
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Launch proof-of-attention interactive video campaigns with PopCoin token reward sponsorship.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Wizard Step Progress */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-canvas)',
          }}
        >
          <div
            onClick={() => setStep(1)}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: step === 1 ? 'var(--accent-teal)' : 'var(--text-muted)',
              borderBottom: `2px solid ${step === 1 ? 'var(--accent-teal)' : 'transparent'}`,
            }}
          >
            <Target size={14} />
            <span>1. Strategy & Project</span>
          </div>

          <div
            onClick={() => setStep(2)}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: step === 2 ? 'var(--accent-teal)' : 'var(--text-muted)',
              borderBottom: `2px solid ${step === 2 ? 'var(--accent-teal)' : 'transparent'}`,
            }}
          >
            <DollarSign size={14} />
            <span>2. Budget & Flight</span>
          </div>

          <div
            onClick={() => setStep(3)}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: step === 3 ? 'var(--accent-teal)' : 'var(--text-muted)',
              borderBottom: `2px solid ${step === 3 ? 'var(--accent-teal)' : 'transparent'}`,
            }}
          >
            <HelpCircle size={14} />
            <span>3. Proof of Attention</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Strategy & Project */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Campaign Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Opportunity OS Q3 Engineering Blitz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Target Interactive Video Project
                </label>
                <select
                  className="input-field"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">-- Standalone / General Network Placement --</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.productGroups.length} Hotspots)
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  The ad campaign will sponsor interactive tokens and hotspots inside this video stream.
                </span>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Category & Industry
                </label>
                <select
                  className="input-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Software & Technology">Software & Technology</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Consumer Electronics">Consumer Electronics</option>
                  <option value="Gaming & Esports">Gaming & Esports</option>
                  <option value="Education & Careers">Education & Careers</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Budget & Flight */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Total Budget ($ USD) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                    <input
                      type="number"
                      min="50"
                      step="10"
                      className="input-field"
                      style={{ paddingLeft: '28px' }}
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Daily Budget Cap ($ USD)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      className="input-field"
                      style={{ paddingLeft: '28px' }}
                      value={dailyBudgetLimit}
                      onChange={(e) => setDailyBudgetLimit(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Flight Start Date
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      className="input-field"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Flight End Date
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      className="input-field"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Bidding & Verification Model
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[
                    {
                      id: 'COMPREHENSION',
                      title: 'Proof of Attention',
                      desc: 'Pay ONLY when viewer correctly answers comprehension quiz.',
                    },
                    {
                      id: 'CPC',
                      title: 'Cost Per Click (CPC)',
                      desc: 'Pay when viewer taps hotspot and opens basket checkout.',
                    },
                    {
                      id: 'CPM',
                      title: 'Cost Per Mille (CPM)',
                      desc: 'Standard pay per 1,000 video impressions.',
                    },
                  ].map((model) => {
                    const isSelected = biddingModel === model.id;
                    return (
                      <div
                        key={model.id}
                        onClick={() => setBiddingModel(model.id as any)}
                        style={{
                          background: isSelected ? 'rgba(20, 184, 166, 0.1)' : 'var(--bg-canvas)',
                          border: `1px solid ${isSelected ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--accent-teal)' : 'var(--text-primary)' }}>
                          {model.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {model.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Proof of Attention Quiz */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Comprehension Verification Question *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={verificationQuestion}
                  onChange={(e) => setVerificationQuestion(e.target.value)}
                  placeholder="e.g. What is the key advantage demonstrated in this video?"
                  required
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Viewers earn +50 PopCoins for correctly answering this within the video player drawer.
                </span>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Multiple Choice Options & Correct Answer
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {verificationOptions.map((opt, idx) => {
                    const isCorrect = correctOptionIndex === idx;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-canvas)',
                          border: `1px solid ${isCorrect ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '8px 12px',
                        }}
                      >
                        <input
                          type="radio"
                          name="correctOption"
                          checked={isCorrect}
                          onChange={() => setCorrectOptionIndex(idx)}
                          style={{ cursor: 'pointer', accentColor: 'var(--accent-emerald)' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', width: '20px' }}>
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <input
                          type="text"
                          className="input-field"
                          style={{ flex: 1, border: 'none', background: 'transparent', padding: '4px' }}
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          required
                        />
                        {isCorrect && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} />
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep((s) => (s - 1) as any)}
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStep((s) => (s + 1) as any)}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Campaign...' : 'Launch Campaign'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
