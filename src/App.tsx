import { useState, useEffect, useRef } from 'react';
import Header, { StudioTab } from './components/Header';
import VideoUploadZone from './components/VideoUploadZone';
import TimelineScrubber from './components/TimelineScrubber';
import ProductBasketEditor from './components/ProductBasketEditor';
import ProductCatalog from './components/ProductCatalog';
import AiAutopilotPanel from './components/AiAutopilotPanel';
import ClipStudio from './components/ClipStudio';
import QuizEditor from './components/QuizEditor';
import DeployModal from './components/DeployModal';
import AuthModal from './components/AuthModal';
import ProjectList from './components/ProjectList';
import CampaignList from './components/CampaignList';
import LivestreamHub from './components/live/LivestreamHub';
import OnAirStudio from './components/live/OnAirStudio';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPortal from './components/AuthPortal';
import { Project, ProductGroup, AiTagDetection, Campaign, StreamSession, Product } from './types';
import { api } from './services/api';

function StudioApp() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<StudioTab>('vod');
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

    const updatedGroups = [...project.productGroups, newGroup].sort(
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
    const updatedGroups = project.productGroups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
    const updated = { ...project, productGroups: updatedGroups };
    setProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Delete a product group
  const handleDeleteGroup = (groupId: string) => {
    if (!project) return;
    const filtered = project.productGroups.filter((g) => g.id !== groupId);
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

    const updatedGroups = [...project.productGroups, newGroup].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
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
      alert('Project saved successfully!');
    } catch (e: any) {
      alert(`Save error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
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


  const selectedGroup = project.productGroups.find((g) => g.id === selectedGroupId) || null;

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
                onSelectProject={(selected) => {
                  setProject(selected);
                  setActiveTab('vod');
                }}
                onProjectCreated={(newProj) => {
                  setProjects([newProj, ...projects]);
                  setProject(newProj);
                  setActiveTab('vod');
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
                              ${selectedGroup.products?.[0]?.price?.toFixed(2) || '0.00'} • 1-Click Buy Active
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timeline Scrubber */}
                  <TimelineScrubber
                    currentTime={currentTime}
                    duration={duration}
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    onSeek={handleSeek}
                    productGroups={project.productGroups}
                    selectedGroupId={selectedGroupId}
                    onSelectGroup={(id) => setSelectedGroupId(id)}
                    onAddPinAtCurrentTime={handleAddPinAtCurrentTime}
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
                availableProductGroups={project.productGroups}
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
            {activeTab === 'clips' && <ClipStudio projectId={project.id} />}

            {/* WATCH-TO-EARN QUIZZES TAB */}
            {activeTab === 'quiz' && <QuizEditor />}
          </main>
        </>
      )}

      {/* Modals */}
      {isDeployOpen && <DeployModal project={project} onClose={() => setIsDeployOpen(false)} />}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
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
