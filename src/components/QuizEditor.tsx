import { useState } from 'react';
import { HelpCircle, Plus, Trash2, Award, DollarSign } from 'lucide-react';
import { QuizQuestion } from '../types';

export default function QuizEditor() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'quiz_1',
      questionText: 'What is the benchmark submission latency of the Opportunity OS Autofill Engine?',
      options: ['10 milliseconds', '45 seconds', '5 minutes', '24 hours'],
      correctIndex: 0,
      bonusTokens: 25,
      cpcSponsorFee: 1.50,
      explanation: 'Opportunity OS utilizes an edge-compiled Rust injector to populate ATS portals in sub-10ms.',
    },
  ]);

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `quiz_${Date.now()}`,
      questionText: 'New Proof-of-Attention Verification Question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      bonusTokens: 20,
      cpcSponsorFee: 1.25,
      explanation: '',
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdate = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[optIdx] = val;
    updated[qIdx].options = opts;
    setQuestions(updated);
  };

  const handleDelete = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="surface-panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">
            <HelpCircle size={16} color="var(--accent-teal)" />
            <span>Interactive Watch-to-Earn Quiz Engine</span>
          </div>
          <div className="panel-desc">
            Reward viewers with PopCoins and charge enterprise sponsors CPC fees for verified brand recall.
          </div>
        </div>

        <button className="btn btn-secondary" onClick={handleAddQuestion} style={{ fontSize: '12px' }}>
          <Plus size={13} /> Add Quiz Challenge
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {questions.map((q, qIdx) => (
          <div
            key={q.id}
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Question #{qIdx + 1}
              </span>

              <button
                className="btn btn-ghost"
                style={{ padding: '4px', color: 'var(--accent-rose)' }}
                onClick={() => handleDelete(qIdx)}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Question Text</label>
              <input
                type="text"
                className="form-input"
                value={q.questionText}
                onChange={(e) => handleUpdate(qIdx, 'questionText', e.target.value)}
                placeholder="e.g. Which feature was demonstrated during the keynote?"
              />
            </div>

            {/* 4 Options */}
            <div style={{ marginBottom: '14px' }}>
              <label className="form-label">Options (Select radio button for correct answer)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                {q.options.map((opt, optIdx) => (
                  <div
                    key={optIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'var(--bg-surface)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${q.correctIndex === optIdx ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <input
                      type="radio"
                      name={`correct_${q.id}`}
                      checked={q.correctIndex === optIdx}
                      onChange={() => handleUpdate(qIdx, 'correctIndex', optIdx)}
                      style={{ cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ border: 'none', background: 'transparent', padding: 0 }}
                      value={opt}
                      onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Economics: Bonus tokens & Sponsor CPC */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={12} color="var(--accent-amber)" /> Bonus PopCoins to Viewer
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={q.bonusTokens}
                  onChange={(e) => handleUpdate(qIdx, 'bonusTokens', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={12} color="var(--status-online)" /> Sponsor CPC Rate (USD)
                </label>
                <input
                  type="number"
                  step="0.05"
                  className="form-input"
                  value={q.cpcSponsorFee}
                  onChange={(e) => handleUpdate(qIdx, 'cpcSponsorFee', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
