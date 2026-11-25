import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  ShoppingBag, 
  Plus, 
  Check, 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  X, 
  Lightbulb, 
  Flame, 
  Coffee,
  ExternalLink,
  Maximize2,
  Minimize2,
  Copy,
  Utensils
} from 'lucide-react';
import { Product, CoDirectorMessage } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../services/toast';
import { resolveProductImageUrl } from '../../utils/imageUtils';

interface AiCoDirectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  catalogProducts: Product[];
  selectedProductIds: string[];
  onToggleProduct: (product: Product) => void;
  onApplyScript: (script: string) => void;
  currentScript: string;
  messages?: CoDirectorMessage[];
  setMessages?: React.Dispatch<React.SetStateAction<CoDirectorMessage[]>>;
}

// Helper to render markdown content with high-contrast formatting (replacing raw **, *, ``, ###)
function renderInlineTokens(text: string): React.ReactNode[] {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[SHOW_PRODUCT:[^\]]+\]|\[PAUSE[^\]]*\]|\[CALL_TO_ACTION[^\]]*\])/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} style={{ color: '#ffffff', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} style={{ color: '#cbd5e1', fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1px 5px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#38bdf8',
            fontFamily: 'monospace',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span
          key={index}
          style={{
            background: 'rgba(99, 102, 241, 0.18)',
            border: '1px solid rgba(129, 140, 248, 0.4)',
            color: '#c7d2fe',
            padding: '1px 6px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'monospace',
            display: 'inline-block',
            margin: '0 2px',
          }}
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function renderFormattedMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: '6px' }} />;
        }

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <div
              key={idx}
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#38bdf8',
                marginTop: idx > 0 ? '6px' : '0px',
                marginBottom: '2px',
                letterSpacing: '-0.01em',
              }}
            >
              {renderInlineTokens(trimmed.slice(4))}
            </div>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <div
              key={idx}
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#f8fafc',
                marginTop: idx > 0 ? '8px' : '0px',
                marginBottom: '2px',
              }}
            >
              {renderInlineTokens(trimmed.slice(3))}
            </div>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <div
              key={idx}
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: '#f8fafc',
                marginTop: idx > 0 ? '10px' : '0px',
                marginBottom: '4px',
              }}
            >
              {renderInlineTokens(trimmed.slice(2))}
            </div>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'baseline',
                paddingLeft: '4px',
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: '#38bdf8', fontSize: '10px', flexShrink: 0 }}>•</span>
              <div style={{ flex: 1 }}>{renderInlineTokens(trimmed.slice(2))}</div>
            </div>
          );
        }

        // Numbered lists (e.g. "1. **The Hook:** ...")
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const number = numMatch[1];
          const text = numMatch[2];
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'baseline',
                paddingLeft: '4px',
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  color: '#818cf8',
                  fontWeight: 700,
                  fontSize: '12px',
                  minWidth: '16px',
                  flexShrink: 0,
                }}
              >
                {number}.
              </span>
              <div style={{ flex: 1 }}>{renderInlineTokens(text)}</div>
            </div>
          );
        }

        // Normal paragraph/text line
        return (
          <div key={idx} style={{ lineHeight: 1.6 }}>
            {renderInlineTokens(trimmed)}
          </div>
        );
      })}
    </div>
  );
}

function SuggestedProductRow({
  prod,
  isSelected,
  catalogProducts,
  onToggle,
}: {
  prod: Product;
  isSelected: boolean;
  catalogProducts: Product[];
  onToggle: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  // 1. Check if item exists in catalog and has a valid image
  const matchedCatalogProd = catalogProducts.find(
    (c) => c.id === prod.id || (c.title && prod.title && c.title.toLowerCase().trim() === prod.title.toLowerCase().trim())
  );
  const resolvedImageUrl = matchedCatalogProd?.imageUrl || prod.imageUrl;

  const hasValidImage =
    !imgFailed &&
    resolvedImageUrl &&
    resolvedImageUrl.startsWith('http') &&
    !resolvedImageUrl.includes('example.com') &&
    !resolvedImageUrl.includes('via.placeholder') &&
    !resolvedImageUrl.includes('...') &&
    !resolvedImageUrl.includes('none');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
        padding: '8px 10px',
        borderRadius: '8px',
        border: isSelected ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        {hasValidImage ? (
          <img
            src={resolveProductImageUrl(resolvedImageUrl)}
            alt={prod.title}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#38bdf8',
            }}
          >
            <ShoppingBag size={16} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#f1f5f9',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {prod.title}
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
            ${prod.price.toFixed(2)}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        style={{
          background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
          border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
          color: isSelected ? '#38bdf8' : '#e2e8f0',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '8px',
          flexShrink: 0,
        }}
      >
        {isSelected ? <Check size={12} /> : <Plus size={12} />}
        <span>{isSelected ? 'In Basket' : 'Add to Basket'}</span>
      </button>
    </div>
  );
}

export default function AiCoDirectorDrawer({
  isOpen,
  onClose,
  catalogProducts,
  selectedProductIds,
  onToggleProduct,
  onApplyScript,
  currentScript,
  messages: externalMessages,
  setMessages: externalSetMessages,
}: AiCoDirectorDrawerProps) {
  const [internalMessages, setInternalMessages] = useState<CoDirectorMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 I\'m your **AI Creative Co-Director & Shoppable Merchandiser**.\n\nTell me what video you want to produce (e.g. *\"Deconstruct the 4 Charles Prime Rib dinner\"*, *\"Speedrun an unboxing of my desk setup\"*, or *\"A 30s TikTok routine\"*)—I\'ll help you prep the recipe, identify all the physical products you\'ll need to monetize, and draft the prompter script with dynamic stage cues!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messages = externalMessages || internalMessages;
  const setMessages = externalSetMessages || setInternalMessages;

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedScriptIds, setExpandedScriptIds] = useState<Record<string, boolean>>({});
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    const userMsg: CoDirectorMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsSending(true);

    try {
      const response = await api.chatWithCoDirector({
        messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        catalogProducts,
        currentScript,
        selectedProductIds,
      });

      const assistantMsg: CoDirectorMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        suggestedProducts: response.suggestedProducts,
        generatedScript: response.generatedScript,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to get response from AI Co-Director.');
    } finally {
      setIsSending(false);
    }
  };

  const handleApplyScript = (script: string) => {
    onApplyScript(script);
    toast.success('✨ Script & stage cues loaded into the teleprompter editor!');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '640px',
        background: 'linear-gradient(180deg, #0b1120 0%, #070a12 100%)',
        border: '1px solid rgba(129, 140, 248, 0.25)',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.08)',
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          padding: '14px 18px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              AI Creative Co-Director
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Concept Ideation • Catalog Sourcing • Cue Timing
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Close Co-Director Drawer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <button
          onClick={() => handleSend('Extract the complete Recipe & Ingredient Manifest from this script into an Instacart-ready grocery checklist with exact quantities, units, and servings.')}
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            padding: '5px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Utensils size={12} />
          <span>🥕 Extract Recipe Manifest (Instacart)</span>
        </button>

        <button
          onClick={() => handleSend('Deconstruct the 4 Charles Prime Rib dinner at home: prepping the recipe, the dry brine, the reverse sear technique, and the shoppable tools needed.')}
          style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            padding: '5px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Flame size={12} />
          <span>🥩 4 Charles Prime Rib</span>
        </button>

        <button
          onClick={() => handleSend('Brainstorm a high-retention shoppable video reviewing Tim Hortons coffee, featuring the Original Blend ground tin and Keurig pods to sell on screen.')}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '5px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Coffee size={12} />
          <span>☕ Tim Hortons Coffee</span>
        </button>

        <button
          onClick={() => handleSend('Brainstorm an unboxing and speedrun review of our store products with a 30-second high energy hook.')}
          style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#7dd3fc',
            padding: '5px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Lightbulb size={12} />
          <span>📦 Product Unboxing</span>
        </button>

        <button
          onClick={() => handleSend('Draft an urgent scarcity pitch script for a limited weekend flash drop.')}
          style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fde68a',
            padding: '5px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Sparkles size={12} />
          <span>⚡ Weekend Drop Hook</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                flexDirection: isUser ? 'row-reverse' : 'row',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isUser ? '#2563eb' : 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {isUser ? <UserIcon size={14} color="#fff" /> : <Bot size={14} color="#fff" />}
              </div>

              <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: isUser ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                    border: isUser ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  {renderFormattedMarkdown(m.content)}
                </div>

                {/* Suggested Shoppable Products */}
                {m.suggestedProducts && m.suggestedProducts.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.05)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                      <ShoppingBag size={13} />
                      <span>Identified Shoppable Products ({m.suggestedProducts.length})</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {m.suggestedProducts.map((prod) => (
                        <SuggestedProductRow
                          key={prod.id}
                          prod={prod}
                          isSelected={selectedProductIds.includes(prod.id)}
                          catalogProducts={catalogProducts}
                          onToggle={() => onToggleProduct(prod)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated Script Preview */}
                {m.generatedScript && (() => {
                  const isExpanded = !!expandedScriptIds[m.id];
                  const isCopied = copiedScriptId === m.id;

                  const handleCopyScript = () => {
                    navigator.clipboard.writeText(m.generatedScript || '');
                    setCopiedScriptId(m.id);
                    toast.success('Script copied to clipboard');
                    setTimeout(() => setCopiedScriptId(null), 2000);
                  };

                  return (
                    <div
                      style={{
                        background: 'rgba(129, 140, 248, 0.07)',
                        border: '1px solid rgba(129, 140, 248, 0.28)',
                        borderRadius: '12px',
                        padding: '14px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <FileText size={14} />
                          <span>Generated Prompter Script with Cues</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedScriptIds((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                            style={{
                              background: isExpanded ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                              border: isExpanded ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                              color: isExpanded ? '#38bdf8' : '#cbd5e1',
                              padding: '5px 9px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                            title={isExpanded ? 'Collapse preview' : 'Expand full script'}
                          >
                            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                            <span>{isExpanded ? 'Collapse' : 'Expand Full'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyScript}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#cbd5e1',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Copy script to clipboard"
                          >
                            {isCopied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApplyScript(m.generatedScript!)}
                            style={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              border: 'none',
                              color: '#fff',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                            }}
                          >
                            <span>Apply to Prompter</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          background: 'rgba(5, 10, 20, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          padding: '14px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: '#e2e8f0',
                          lineHeight: 1.7,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          maxHeight: isExpanded ? 'none' : '300px',
                          overflowY: isExpanded ? 'visible' : 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          transition: 'max-height 0.2s ease',
                        }}
                      >
                        {m.generatedScript}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ fontSize: '10px', color: '#64748b', alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={14} color="#fff" className="animate-spin" />
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Co-Director is analyzing recipe & mapping catalog items...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <div
        style={{
          padding: '14px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Discuss video ideas, recipe steps, or ask to draft a script..."
            style={{
              flex: 1,
              background: '#090e1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '0 16px',
              color: '#ffffff',
              cursor: (!inputText.trim() || isSending) ? 'not-allowed' : 'pointer',
              opacity: (!inputText.trim() || isSending) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
