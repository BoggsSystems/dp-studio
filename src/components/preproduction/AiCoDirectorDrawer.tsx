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
  ExternalLink 
} from 'lucide-react';
import { Product, CoDirectorMessage } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../services/toast';

interface AiCoDirectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  catalogProducts: Product[];
  selectedProductIds: string[];
  onToggleProduct: (product: Product) => void;
  onApplyScript: (script: string) => void;
  currentScript: string;
}

export default function AiCoDirectorDrawer({
  isOpen,
  onClose,
  catalogProducts,
  selectedProductIds,
  onToggleProduct,
  onApplyScript,
  currentScript,
}: AiCoDirectorDrawerProps) {
  const [messages, setMessages] = useState<CoDirectorMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 I\'m your **AI Creative Co-Director & Shoppable Merchandiser**.\n\nTell me what video you want to produce (e.g. *\"Deconstruct the 4 Charles Prime Rib dinner\"*, *\"Speedrun an unboxing of my desk setup\"*, or *\"A 30s TikTok routine\"*)—I\'ll help you prep the recipe, identify all the physical products you\'ll need to monetize, and draft the prompter script with dynamic stage cues!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
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
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.content}
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
                      {m.suggestedProducts.map((prod) => {
                        const isSelected = selectedProductIds.includes(prod.id);
                        return (
                          <div
                            key={prod.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(0, 0, 0, 0.3)',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: isSelected ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <img
                                src={prod.imageUrl || 'https://via.placeholder.com/40'}
                                alt={prod.title}
                                style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {prod.title}
                                </div>
                                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                                  \${prod.price.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => onToggleProduct(prod)}
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
                              }}
                            >
                              {isSelected ? <Check size={12} /> : <Plus size={12} />}
                              <span>{isSelected ? 'In Basket' : 'Add to Basket'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Generated Script Preview */}
                {m.generatedScript && (
                  <div
                    style={{
                      background: 'rgba(129, 140, 248, 0.06)',
                      border: '1px solid rgba(129, 140, 248, 0.25)',
                      borderRadius: '10px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
                        <FileText size={13} />
                        <span>Generated Prompter Script with Cues</span>
                      </div>
                      <button
                        onClick={() => handleApplyScript(m.generatedScript!)}
                        style={{
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          border: 'none',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Apply to Prompter</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>

                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#cbd5e1',
                        lineHeight: 1.5,
                        fontFamily: 'monospace',
                        maxHeight: '140px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.generatedScript}
                    </div>
                  </div>
                )}

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
