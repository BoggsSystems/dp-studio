import { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import Header, { StudioTab } from './components/Header';
import VideoUploadZone from './components/VideoUploadZone';
import TimelineScrubber from './components/TimelineScrubber';
import ProductBasketEditor from './components/ProductBasketEditor';
import ProductCatalog from './components/ProductCatalog';
import AiAutopilotPanel from './components/AiAutopilotPanel';
import ShortsFormatterStudio from './components/ShortsFormatterStudio';
import QuizEditor from './components/QuizEditor';
import DeployModal from './components/DeployModal';
import AuthModal from './components/AuthModal';
import ProjectList from './components/ProjectList';
import CampaignList from './components/CampaignList';
import LivestreamHub from './components/live/LivestreamHub';
import OnAirStudio from './components/live/OnAirStudio';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPortal from './components/AuthPortal';
import ToastContainer from './components/ToastContainer';
import { toast } from './services/toast';
import { Project, ProductGroup, AiTagDetection, Campaign, StreamSession, Product, FormattedShortProject } from './types';
import { loadShortProjectIntoActiveDraft } from './services/videoStorage';
import { api } from './services/api';
import TermsOfService from './components/legal/TermsOfService';
import PrivacyPolicy from './components/legal/PrivacyPolicy';

function StudioApp() {
  const { user, isLoading } = useAuth();
  const [legalPage, setLegalPage] = useState<'terms' | 'privacy' | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();
    if (path === '/terms' || path === '/terms.html' || params.get('page') === 'terms' || hash === '#terms') {
      return 'terms';
    }
    if (path === '/privacy' || path === '/privacy.html' || params.get('page') === 'privacy' || hash === '#privacy') {
      return 'privacy';
    }
    return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      if (path === '/terms' || path === '/terms.html' || params.get('page') === 'terms' || hash === '#terms') {
        setLegalPage('terms');
      } else if (path === '/privacy' || path === '/privacy.html' || params.get('page') === 'privacy' || hash === '#privacy') {
        setLegalPage('privacy');
      } else {
        setLegalPage(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [activeTab, setActiveTab] = useState<StudioTab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeLiveSession, setActiveLiveSession] = useState<StreamSession | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(14.5);
  const [duration, setDuration] = useState<number>(142.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isDeployOpen, setIsDeployOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCapturingThumbnail, setIsCapturingThumbnail] = useState<boolean>(false);
  const [thumbnailToast, setThumbnailToast] = useState<string | null>(null);

  const videoElementRef = useRef<HTMLVideoElement>(null);

  // Load initial data only when authenticated
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setProject(null);
      return;
    }

    api.getProjects().then((projs) => {
      setProjects(projs);
      if (projs.length > 0) {
        setProject(projs[0]);
        if (projs[0].durationSeconds) setDuration(projs[0].durationSeconds);
        if (projs[0].productGroups?.length > 0) {
          setSelectedGroupId(projs[0].productGroups[0].id);
        }
      } else {
        const newP: Project = {
          id: `proj_${Date.now()}`,
          name: 'My First Shoppable Video',
          status: 'PROCESSING',
          isActive: true,
          productGroups: [],
        };
        setProjects([newP]);
        setProject(newP);
      }
    });

    api.getCampaigns().then((camps) => {
      setCampaigns(camps);
    });

    api.getProducts().then((prods) => {
      setCatalogProducts(prods);
    });
  }, [user]);


  // Sync video element time
  const handleTimeUpdate = () => {
    if (videoElementRef.current) {
      setCurrentTime(videoElementRef.current.currentTime);
    }
  };

  const handlePlayPause = () => {
    if (!videoElementRef.current) return;
    if (isPlaying) {
      videoElementRef.current.pause();
      setIsPlaying(false);
    } else {
      videoElementRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoElementRef.current) {
      videoElementRef.current.currentTime = time;
    }
  };

  // Video Loaded
  const handleVideoLoaded = (url: string, videoDuration: number, thumb?: string) => {
    if (!project) return;
    setDuration(videoDuration);
    const updated = {
      ...project,
      masterVodUrl: url,
      durationSeconds: videoDuration,
      ...(thumb && { thumbnailUrl: thumb }),
    };
    setProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Drop pin at current time
  const handleAddPinAtCurrentTime = () => {
    if (!project) return;

    const initialProduct: Product = catalogProducts.length > 0 ? catalogProducts[0] : {
      id: `prod_${Date.now()}`,
      title: 'Featured Product Item',
      price: 39.00,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
      stripePriceId: '',
      description: '1-click checkout item.',
    };

    const newGroup: ProductGroup = {
      id: `pg_${Date.now()}`,
      projectId: project.id,
      title: `Shoppable Pin @ ${currentTime.toFixed(1)}s`,
      subtitle: 'Special In-Stream Offer',
      timestampSeconds: parseFloat(currentTime.toFixed(1)),
      viewingMode: 'SIDE_PANEL',
      products: [initialProduct],
    };

    const currentGroups = project.productGroups || [];
    const updatedGroups = [...currentGroups, newGroup].sort(
      (a, b) => a.timestampSeconds - b.timestampSeconds
    );
    const updated = { ...project, productGroups: updatedGroups };
    setProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedGroupId(newGroup.id);
  };

  // Update a product group
  const handleUpdateGroup = (updatedGroup: ProductGroup) => {
    if (!project) return;
    const currentGroups = project.productGroups || [];
    const updatedGroups = currentGroups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
    const updated = { ...project, productGroups: updatedGroups };
    setProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Delete a product group
  const handleDeleteGroup = (groupId: string) => {
    if (!project) return;
    const currentGroups = project.productGroups || [];
    const filtered = currentGroups.filter((g) => g.id !== groupId);
    const updated = { ...project, productGroups: filtered };
    setProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedGroupId(filtered.length > 0 ? filtered[0].id : null);
  };

  // Adopt AI detections
  const handleAdoptAiDetection = (det: AiTagDetection) => {
    if (!project) return;
    const newGroup: ProductGroup = {
      id: `pg_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId: project.id,
      title: det.title,
      subtitle: `${det.category} • AI Identified`,
      timestampSeconds: det.timestampSeconds,
      viewingMode: 'SIDE_PANEL',
      products: [
        {
          id: `prod_ai_${Date.now()}`,
          title: det.title,
          price: det.suggestedPrice,
          currency: 'USD',
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
          imageUrls: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80'],
          stripePriceId: '',
        },
      ],
    };

    const currentGroups = project.productGroups || [];
    const updatedGroups = [...currentGroups, newGroup].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    const updated = { ...project, productGroups: updatedGroups };
    setProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedGroupId(newGroup.id);
  };

  const handleAdoptAllAiDetections = (dets: AiTagDetection[]) => {
    dets.forEach((d) => handleAdoptAiDetection(d));
  };

  // Save Project
  const handleSaveProject = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      const saved = await api.saveProject(project);
      setProject(saved);
      setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      toast.success('Project saved successfully!', 'Saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save project', 'Save Error');
    } finally {
      setIsSaving(false);
    }
  };

  const captureFrameFromVideo = (video: HTMLVideoElement): string => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.warn('Canvas frame capture error:', e);
      return '';
    }
  };

  // 1-Click Scrub-to-Set Thumbnail (Option C)
  const handleCaptureThumbnail = async () => {
    if (!videoElementRef.current || !project) return;
    setIsCapturingThumbnail(true);

    try {
      const dataUrl = captureFrameFromVideo(videoElementRef.current);
      if (!dataUrl) throw new Error('Could not capture frame from video');

      const updated = { ...project, thumbnailUrl: dataUrl };
      setProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

      // Persist to backend so it shows in Projects catalog
      await api.saveProject(updated);

      toast.success(`Thumbnail updated at ${currentTime.toFixed(1)}s!`, 'Thumbnail Saved');
    } catch (err: any) {
      console.error('Failed to capture thumbnail:', err);
      toast.error(err.message || 'Failed to capture thumbnail', 'Thumbnail Error');
    } finally {
      setIsCapturingThumbnail(false);
    }
  };

  // Smart Auto-Extract on Video Load (Option C)
  const handleAutoCaptureInitialThumbnail = async () => {
    if (!videoElementRef.current || !project || project.thumbnailUrl) return;
    const dataUrl = captureFrameFromVideo(videoElementRef.current);
    if (!dataUrl) return;

    const updated = { ...project, thumbnailUrl: dataUrl };
    setProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    api.saveProject(updated).catch(() => {});
  };

  const handleNewProject = () => {
    const newP: Project = {
      id: `proj_${Date.now()}`,
      name: 'New Shoppable Video Project',
      status: 'PROCESSING',
      isActive: true,
      productGroups: [],
    };
    setProjects([newP, ...projects]);
    setProject(newP);
    setSelectedGroupId(null);
    setCurrentTime(0);
    setActiveTab('vod');
  };

  if (legalPage === 'terms') {
    return (
      <TermsOfService
        onBack={() => {
          window.history.pushState({}, '', '/');
          setLegalPage(null);
        }}
      />
    );
  }

  if (legalPage === 'privacy') {
    return (
      <PrivacyPolicy
        onBack={() => {
          window.history.pushState({}, '', '/');
          setLegalPage(null);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div
        className="studio-root"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--border-medium)',
              borderTopColor: 'var(--accent-teal)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Verifying DigitPop Studio authentication...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPortal />;
  }

  if (!project) {
    return (
      <div className="studio-root" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading DigitPop Studio...</div>
      </div>
    );
  }


  const selectedGroup = (project.productGroups || []).find((g) => g.id === selectedGroupId) || null;

  return (
    <div className="studio-root">
      {/* If inside OnAirStudio fullscreen broadcast console, replace top layout */}
      {activeLiveSession ? (
        <main className="studio-main" style={{ padding: '16px' }}>
          <OnAirStudio
            session={activeLiveSession}
            onExit={() => setActiveLiveSession(null)}
          />
        </main>
      ) : (
        <>
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            project={project}
            onSave={handleSaveProject}
            onOpenDeploy={() => setIsDeployOpen(true)}
            isSaving={isSaving}
            onNewProject={handleNewProject}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />

          <main className="studio-main">
            {/* PROJECTS CATALOG TAB */}
            {activeTab === 'projects' && (
              <ProjectList
                projects={projects}
                availableProducts={catalogProducts}
                onSelectProject={async (selected) => {
                  setProject(selected);
                  const isShort =
                    selected.mediaType === 'SHORT' ||
                    (selected.masterVodUrl ? selected.masterVodUrl.includes('/shorts/') || selected.masterVodUrl.includes('_SHORT') : false) ||
                    selected.channel === 'shorts';
                  if (isShort) {
                    const shortObj: FormattedShortProject = {
                      id: selected.id,
                      title: selected.name,
                      videoUrl: selected.masterVodUrl,
                      thumbnailUrl: selected.thumbnailUrl,
                      durationSeconds: selected.durationSeconds || 60,
                      words: (selected.metadata as any)?.words || [],
                      editableTranscript: (selected.metadata as any)?.editableTranscript || '',
                      highlightColor: (selected.metadata as any)?.highlightColor || 'amber',
                      fontSize: (selected.metadata as any)?.fontSize || 22,
                      verticalPosition: (selected.metadata as any)?.verticalPosition || 78,
                      wordPacing: (selected.metadata as any)?.wordPacing || 'POP_TWO_WORDS',
                      autoEmojis: (selected.metadata as any)?.autoEmojis ?? true,
                      uppercase: (selected.metadata as any)?.uppercase ?? true,
                      layoutMode: (selected.metadata as any)?.layoutMode || 'FIT_BLUR',
                      showShoppableDrawer: true,
                      showQrCode: true,
                      qrPlacement: 'TOP_RIGHT',
                      qrCustomUrl: '',
                      status: selected.status === 'READY' ? 'PUBLISHED' : 'DRAFT',
                      createdAt: selected.createdAt || new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                    await loadShortProjectIntoActiveDraft(shortObj).catch(() => {});
                    setActiveTab('clips');
                  } else {
                    setActiveTab('vod');
                  }
                }}
                onProjectCreated={(newProj) => {
                  setProjects([newProj, ...projects]);
                  setProject(newProj);
                  const isShort =
                    newProj.mediaType === 'SHORT' ||
                    (newProj.masterVodUrl ? newProj.masterVodUrl.includes('/shorts/') || newProj.masterVodUrl.includes('_SHORT') : false) ||
                    newProj.channel === 'shorts';
                  setActiveTab(isShort ? 'clips' : 'vod');
                }}
                onOpenShort={() => {
                  setActiveTab('clips');
                }}
                onOpenLiveStudio={(session) => {
                  setActiveLiveSession(session);
                }}
              />
            )}

            {/* SHOPPABLE VOD TIMELINE EDITOR TAB */}
            {activeTab === 'vod' && (
              <div className="studio-grid-2col">
                {/* Left Column: Media Player, Timeline Scrubber, AI Scanner */}
                <div>
                  <VideoUploadZone
                    videoUrl={project.masterVodUrl}
                    thumbnailUrl={project.thumbnailUrl}
                    onVideoLoaded={handleVideoLoaded}
                  />

                  {/* Main Player Display */}
                  {project.masterVodUrl && (
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        background: '#000000',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-medium)',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      <video
                        ref={videoElementRef}
                        src={project.masterVodUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onLoadedData={() => {
                          if (!project.thumbnailUrl && videoElementRef.current) {
                            handleAutoCaptureInitialThumbnail();
                          }
                        }}
                        controls={false}
                      />

                      {/* Active Pin Overlay Indicator */}
                      {selectedGroup && Math.abs(currentTime - selectedGroup.timestampSeconds) < 4.0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'rgba(15, 23, 42, 0.88)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid var(--accent-teal)',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#ffffff',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                            animation: 'fadeIn 0.2s ease',
                          }}
                        >
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-teal)' }} />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700 }}>{selectedGroup.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--accent-teal-light)' }}>
                              ${Number(selectedGroup.products?.[0]?.price || 0).toFixed(2)} • 1-Click Buy Active

                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timeline Scrubber with 1-Click Frame Capture */}
                  <TimelineScrubber
                    currentTime={currentTime}
                    duration={duration}
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    onSeek={handleSeek}
                    productGroups={project.productGroups || []}
                    selectedGroupId={selectedGroupId}
                    onSelectGroup={(id) => setSelectedGroupId(id)}
                    onAddPinAtCurrentTime={handleAddPinAtCurrentTime}
                    onCaptureThumbnail={handleCaptureThumbnail}
                    isCapturingThumbnail={isCapturingThumbnail}
                  />

                  {/* AI Autopilot Scanner */}
                  <AiAutopilotPanel
                    videoUrl={project.masterVodUrl}
                    onAdoptDetection={handleAdoptAiDetection}
                    onAdoptAllDetections={handleAdoptAllAiDetections}
                  />
                </div>

                {/* Right Column: Product Group & Basket Configuration */}
                <div>
                  <ProductBasketEditor
                    selectedGroup={selectedGroup}
                    onUpdateGroup={handleUpdateGroup}
                    onDeleteGroup={handleDeleteGroup}
                    currentTime={currentTime}
                    catalogProducts={catalogProducts}
                    onCatalogUpdated={setCatalogProducts}
                  />
                </div>
              </div>
            )}

            {/* CENTRAL PRODUCTS CATALOG TAB */}
            {activeTab === 'products' && (
              <ProductCatalog
                products={catalogProducts}
                onProductsUpdated={setCatalogProducts}
              />
            )}

            {/* LIVESTREAM BROADCAST HUB TAB */}
            {activeTab === 'live' && (
              <LivestreamHub
                onEnterOnAirStudio={(session) => setActiveLiveSession(session)}
                availableProductGroups={project.productGroups || []}
              />
            )}

            {/* ENTERPRISE AD CAMPAIGNS TAB */}
            {activeTab === 'campaigns' && (
              <CampaignList
                campaigns={campaigns}
                projects={projects}
                onCampaignCreated={(newCamp) => {
                  setCampaigns([newCamp, ...campaigns]);
                }}
              />
            )}

            {/* AI VIRAL SHORTS (9:16) TAB */}
            {activeTab === 'clips' && <ShortsFormatterStudio />}

            {/* WATCH-TO-EARN QUIZZES TAB */}
            {activeTab === 'quiz' && <QuizEditor />}
          </main>
        </>
      )}

      {/* Modals */}
      {isDeployOpen && <DeployModal project={project} onClose={() => setIsDeployOpen(false)} />}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Toast Notification */}
      {thumbnailToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--accent-teal)',
            color: 'var(--text-primary)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle size={16} color="var(--accent-teal)" />
          <span>{thumbnailToast}</span>
        </div>
      )}

      {/* Global Studio Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StudioApp />
    </AuthProvider>
  );
}
