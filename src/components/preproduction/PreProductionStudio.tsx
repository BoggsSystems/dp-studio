import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Smartphone, 
  ShoppingBag, 
  Clock, 
  Play, 
  Save, 
  Check, 
  ChevronRight, 
  HelpCircle, 
  Layers, 
  Zap, 
  AlertCircle,
  FileText 
} from 'lucide-react';
import { Product, Project, ProductGroup } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../services/toast';
import MobileBridgeModal from './MobileBridgeModal';
import AiCoDirectorDrawer from './AiCoDirectorDrawer';

interface PreProductionStudioProps {
  project: Project | null;
  catalogProducts: Product[];
  onProjectUpdate: (updatedProject: Project) => void;
  onNavigateToTimeline: () => void;
}

export default function PreProductionStudio({
  project,
  catalogProducts,
  onProjectUpdate,
  onNavigateToTimeline,
}: PreProductionStudioProps) {
  // 1. Product Basket (1-3 products)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    if (project?.productGroups && project.productGroups.length > 0) {
      const ids: string[] = [];
      project.productGroups.forEach((g) => {
        if (g.products) {
          g.products.forEach((p) => {
            if (p.id && !ids.includes(p.id)) ids.push(p.id);
          });
        }
      });
      if (ids.length > 0) return ids.slice(0, 3);
    }
    return catalogProducts.length > 0 ? [catalogProducts[0].id] : [];
  });

  // 2. Script & Pacing
  const [scriptText, setScriptText] = useState<string>(() => {
    return (
      (project?.metadata as any)?.preproductionScript ||
      `Hey everyone! Today I want to show you the ultimate setup game changer.
[SHOW_PRODUCT: Opportunity OS Pro Pass]
Look at how seamless the 1-click autofill is. It completely eliminates repetitive job applications in seconds.
[PAUSE 2s]
If you're tired of filling out endless career portals, check the link right here in the video.
[CALL_TO_ACTION: Grab yours before the drop ends]`
    );
  });
  const [targetWpm, setTargetWpm] = useState<number>(140);
  const [scriptTone, setScriptTone] = useState<'VIRAL_HOOK' | 'PRODUCT_DEMO' | 'URGENT_DROP'>('VIRAL_HOOK');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [activeMode, setActiveMode] = useState<'co-director' | 'script-writer'>('co-director');

  // 3. Mobile Bridge Modal State
  const [bridgeModalOpen, setBridgeModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<{ token: string; shortCode: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate metrics
  const cleanWords = scriptText.replace(/\[[^\]]*\]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const wordCount = cleanWords.length;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / targetWpm) * 60));

  // Toggle selected products
  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 3) {
        toast.info('You can select up to 3 showcase products for a single vertical short.');
        return prev;
      }
      return [...prev, productId];
    });
  };

  const handleToggleProductFromCoDirector = (prod: Product) => {
    if (!catalogProducts.some((p) => p.id === prod.id)) {
      catalogProducts.push(prod);
    }
    toggleProduct(prod.id);
  };

  // Insert cue tags at cursor position
  const insertCue = (tag: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = scriptText.substring(0, start);
    const after = scriptText.substring(end);
    const newText = `${before} ${tag} ${after}`;
    setScriptText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
    }, 50);
  };

  // AI Script Generator
  const handleGenerateScript = async () => {
    const selectedProds = catalogProducts.filter((p) => selectedProductIds.includes(p.id));
    if (selectedProds.length === 0) {
      toast.error('Please select at least 1 product from your catalog first.');
      return;
    }

    setIsGeneratingAi(true);
    const mainProd = selectedProds[0];

    try {
      // Simulate/Generate AI Pitch with embedded cues tailored to the product
      let generated = '';
      if (scriptTone === 'VIRAL_HOOK') {
        generated = `Stop scrolling if you want to save 10 hours this week.
[SHOW_PRODUCT: ${mainProd.title}]
This is ${mainProd.title}, and here is why everyone on TikTok is obsessing over it.
It gives you ${mainProd.description || 'instant high performance'} with zero learning curve.
[PAUSE 2s]
Watch how it looks in action.
You can tap the tag on your screen right now to lock in yours before stock sells out!
[CALL_TO_ACTION: Tap product pin to shop]`;
      } else if (scriptTone === 'PRODUCT_DEMO') {
        generated = `Here is my honest 30-second review of ${mainProd.title}.
[SHOW_PRODUCT: ${mainProd.title}]
The build quality is unbelievable. ${mainProd.description || 'Engineered with top tier precision.'}
[PAUSE 1s]
Compare this to generic alternatives, and you'll never go back.
I linked it directly in the video so you can check specs and pricing.
[CALL_TO_ACTION: Tap pin for instant checkout]`;
      } else {
        generated = `Urgent announcement: ${mainProd.title} is finally back in stock!
[SHOW_PRODUCT: ${mainProd.title}]
Last drop sold out in under 48 hours. Only a few units remain at this price.
[PAUSE 2s]
Don't wait—tap the product bubble directly on your screen to order before they're gone.
[CALL_TO_ACTION: Grab yours now]`;
      }

      setScriptText(generated);
      toast.success('✨ AI Pitch Script generated with shoppable cues!');
    } catch {
      toast.error('Failed to generate script.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Launch Mobile Teleprompter Session
  const handleLaunchMobileShoot = async () => {
    let currentProject = project;
    if (!currentProject) {
      try {
        currentProject = await api.saveProject({
          name: 'New Shoppable Video Shoot',
          status: 'DRAFT',
          isActive: true,
          productGroups: [],
        });
        onProjectUpdate(currentProject);
      } catch (err) {
        console.warn('Auto-create project fallback:', err);
      }
    }
    const targetProjectId = currentProject?.id || `proj_${Date.now()}`;

    const selectedProds = catalogProducts.filter((p) => selectedProductIds.includes(p.id));

    try {
      toast.info('Initializing phone recording bridge...');
      const sessionRes = await api.createRecordingSession({
        projectId: targetProjectId,
        scriptText,
        products: selectedProds,
        targetWpm,
      });

      setActiveSession({
        token: sessionRes.token,
        shortCode: sessionRes.shortCode,
      });
      setBridgeModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start phone recording session.');
    }
  };

  // Save Script to Project
  const handleSaveDraft = async () => {
    try {
      const updatedMeta = {
        ...(project?.metadata || {}),
        preproductionScript: scriptText,
        preproductionTargetWpm: targetWpm,
        preproductionProductIds: selectedProductIds,
      };

      if (!project) {
        const newProj = await api.saveProject({
          name: 'New Shoppable Video Shoot',
          status: 'DRAFT',
          isActive: true,
          productGroups: [],
          metadata: updatedMeta,
        });
        onProjectUpdate(newProj);
        toast.success('Project created and script saved!');
        return;
      }

      const updatedProject: Project = {
        ...project,
        metadata: updatedMeta,
      };

      await api.saveProject({ id: project.id, metadata: updatedMeta });
      onProjectUpdate(updatedProject);
      toast.success('Script and pre-production settings saved to project!');
    } catch {
      toast.error('Failed to save script.');
    }
  };

  // Handle take received from phone bridge
  const handleTakeReceived = (data: { videoUrl: string; durationSeconds: number; cuePins?: any[] }) => {
    const baseProject: Project = project || {
      id: `proj_${Date.now()}`,
      name: 'New Shoppable Video Shoot',
      status: 'READY',
      isActive: true,
      productGroups: [],
    };

    // Convert cuePins to project productGroups
    const selectedProds = catalogProducts.filter((p) => selectedProductIds.includes(p.id));
    const newGroups: ProductGroup[] = (data.cuePins || []).map((cp, idx) => {
      const prod = selectedProds.find((p) => p.id === cp.productId) || selectedProds[0];
      return {
        id: `group_cue_${Date.now()}_${idx}`,
        projectId: baseProject.id,
        title: prod?.title || 'Featured Product',
        timestampSeconds: cp.timestampSeconds || 0,
        viewingMode: 'TAP_TO_REVEAL',
        products: prod ? [prod] : [],
        thumbnailUrl: prod?.imageUrl,
      };
    });

    const updatedProject: Project = {
      ...baseProject,
      masterVodUrl: data.videoUrl,
      durationSeconds: data.durationSeconds,
      productGroups: newGroups.length > 0 ? newGroups : baseProject.productGroups,
    };

    onProjectUpdate(updatedProject);
    setBridgeModalOpen(false);
    toast.success('🎉 Video imported! Switched to timeline editor.');
    onNavigateToTimeline();
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#38bdf8', textTransform: 'uppercase' }}>
              Pre-Production Suite
            </span>
            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              Studio • Mobile QR Bridge
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Script, Stage Cues & Mobile Teleprompter
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
            Select products, script your pitch with shoppable cues, and shoot directly on your phone with zero eye-line drift.
          </p>
        </div>

        {/* Action Buttons & Tab Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Studio Mode Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              onClick={() => setActiveMode('co-director')}
              style={{
                background: activeMode === 'co-director' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
                color: activeMode === 'co-director' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeMode === 'co-director' ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none',
              }}
            >
              <Sparkles size={15} />
              <span>AI Co-Director & Merchandiser</span>
            </button>

            <button
              onClick={() => setActiveMode('script-writer')}
              style={{
                background: activeMode === 'script-writer' ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'transparent',
                color: activeMode === 'script-writer' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeMode === 'script-writer' ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
              }}
            >
              <FileText size={15} />
              <span>Teleprompter Script Writer</span>
              <span
                style={{
                  fontSize: '11px',
                  background: activeMode === 'script-writer' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: activeMode === 'script-writer' ? '#ffffff' : '#94a3b8',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  marginLeft: '4px',
                }}
              >
                {estimatedSeconds}s
              </span>
            </button>
          </div>

          <button
            onClick={handleSaveDraft}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <Save size={15} />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleLaunchMobileShoot}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#ffffff',
              padding: '10px 22px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.35)',
            }}
          >
            <Smartphone size={17} />
            <span>Shoot on Phone with Teleprompter</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
        {/* Left Column: Product Selection & Stage Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Product Basket Picker */}
          <div
            style={{
              background: 'var(--bg-surface, #0f172a)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={16} color="#38bdf8" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Showcase Products</h3>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {selectedProductIds.length}/3 selected
              </span>
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Select 1 to 3 products featured in this video. Stage cues will automatically anchor pins for these items.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {catalogProducts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No products in catalog. Add items in the Products tab first!
                </div>
              ) : (
                catalogProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <img
                        src={p.imageUrl || 'https://via.placeholder.com/60'}
                        alt={p.title}
                        style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', background: '#000' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700, marginTop: '2px' }}>
                          ${p.price.toFixed(2)}
                        </div>
                      </div>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                          background: isSelected ? '#38bdf8' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && <Check size={13} color="#0f172a" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Teleprompter Pacing Controls */}
          <div
            style={{
              background: 'var(--bg-surface, #0f172a)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Clock size={16} color="#38bdf8" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Pacing & Duration</h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Target Speaking Rate:</span>
                <strong style={{ color: '#38bdf8' }}>{targetWpm} WPM</strong>
              </div>
              <input
                type="range"
                min={110}
                max={180}
                step={5}
                value={targetWpm}
                onChange={(e) => setTargetWpm(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                <span>110 (Calm Demo)</span>
                <span>140 (Standard)</span>
                <span>180 (Viral Hook)</span>
              </div>
            </div>

            {/* Estimated Duration Stat Box */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Video Runtime
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                  {estimatedSeconds}s{' '}
                  <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>
                    ({wordCount} words)
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: estimatedSeconds <= 60 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: estimatedSeconds <= 60 ? '#34d399' : '#fbbf24',
                }}
              >
                {estimatedSeconds <= 60 ? '✓ 9:16 Short Fit' : 'Extended Short'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Tab Mode */}
        {activeMode === 'co-director' ? (
          <AiCoDirectorDrawer
            isOpen={true}
            onClose={() => setActiveMode('script-writer')}
            catalogProducts={catalogProducts}
            selectedProductIds={selectedProductIds}
            onToggleProduct={handleToggleProductFromCoDirector}
            onApplyScript={(newScript) => {
              setScriptText(newScript);
              setActiveMode('script-writer');
            }}
            currentScript={scriptText}
          />
        ) : (
          <div
            style={{
              background: 'var(--bg-surface, #0f172a)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
          {/* AI Script Assistant Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(129, 140, 248, 0.08)',
              border: '1px solid rgba(129, 140, 248, 0.25)',
              borderRadius: '10px',
              marginBottom: '18px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#818cf8" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#c7d2fe' }}>
                AI Teleprompter Script Writer
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={scriptTone}
                onChange={(e: any) => setScriptTone(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(129, 140, 248, 0.3)',
                  color: '#e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <option value="VIRAL_HOOK">Viral Hook (TikTok / Reels)</option>
                <option value="PRODUCT_DEMO">Honest Review / Showcase</option>
                <option value="URGENT_DROP">Urgent Drop / Scarcity</option>
              </select>

              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingAi}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isGeneratingAi ? 'not-allowed' : 'pointer',
                  opacity: isGeneratingAi ? 0.7 : 1,
                }}
              >
                <Zap size={14} />
                <span>{isGeneratingAi ? 'Writing Pitch...' : 'Draft Script with Cues'}</span>
              </button>
            </div>
          </div>

          {/* Quick Insert Cue Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Insert Stage Cue:</span>
            {selectedProductIds.length > 0 && (
              <button
                onClick={() => {
                  const p = catalogProducts.find((item) => item.id === selectedProductIds[0]);
                  insertCue(`[SHOW_PRODUCT: ${p ? p.title : 'Product'}]`);
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#38bdf8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                + [SHOW_PRODUCT]
              </button>
            )}
            <button
              onClick={() => insertCue('[PAUSE 2s]')}
              style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                color: '#fbbf24',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              + [PAUSE 2s]
            </button>
            <button
              onClick={() => insertCue('[CALL_TO_ACTION: Tap pin to shop]')}
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              + [CALL_TO_ACTION]
            </button>
          </div>

          {/* Main Script Textarea */}
          <textarea
            ref={textareaRef}
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="Write your script here... Use stage cues like [SHOW_PRODUCT: Name] to automatically time product pins."
            style={{
              flex: 1,
              minHeight: '380px',
              background: '#090e1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '18px',
              color: '#f8fafc',
              fontSize: '15px',
              lineHeight: 1.7,
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
            <span>Stage cues enclosed in brackets [ ] will render as visual HUD prompts on your phone without scrolling as speech.</span>
            <span>{wordCount} words</span>
          </div>
        </div>
        )}
      </div>

      {/* Mobile Bridge Modal */}
      {bridgeModalOpen && activeSession && (
        <MobileBridgeModal
          isOpen={bridgeModalOpen}
          onClose={() => setBridgeModalOpen(false)}
          sessionToken={activeSession.token}
          shortCode={activeSession.shortCode}
          onTakeReceived={handleTakeReceived}
        />
      )}
    </div>
  );
}
