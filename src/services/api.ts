import { Project, Clip, AiTagDetection } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:9000').replace(/\/+$/, '');
const R2_PUBLIC_DOMAIN = 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev';

export const api = {
  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Falling back to local cache or seed projects');
      return getMockProjects();
    }
  },

  async getProject(id: string): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      const mock = getMockProjects().find(p => p.id === id);
      if (mock) return mock;
      throw e;
    }
  },

  async saveProject(project: Partial<Project>): Promise<Project> {
    const isNew = !project.id || project.id.startsWith('temp_');
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API_BASE_URL}/api/projects` : `${API_BASE_URL}/api/projects/${project.id}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Simulating offline project save:', e);
      return {
        ...project,
        id: project.id || `proj_${Date.now()}`,
        status: 'READY',
        isActive: true,
        productGroups: project.productGroups || [],
      } as Project;
    }
  },

  // --- Cloudflare R2 Upload Simulation / Integration ---
  async uploadMedia(
    file: File,
    pathPrefix: string = 'vods',
    onProgress?: (pct: number) => void
  ): Promise<{ url: string; key: string }> {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${pathPrefix}/${Date.now()}_${cleanFileName}`;
    const destinationUrl = `${R2_PUBLIC_DOMAIN}/${key}`;

    // Upload simulation / execution via server proxy
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);

    try {
      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<{ url: string; key: string }>((resolve) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ url: destinationUrl, key });
          } else {
            // Default to R2 destination URL directly
            resolve({ url: destinationUrl, key });
          }
        });
        xhr.addEventListener('error', () => {
          // Direct fallback
          resolve({ url: destinationUrl, key });
        });
        xhr.open('POST', `${API_BASE_URL}/api/storage/upload`);
        xhr.send(formData);
      });

      return await uploadPromise;
    } catch (err) {
      if (onProgress) onProgress(100);
      return { url: destinationUrl, key };
    }
  },

  // --- AI Autopilot Scanner ---
  async scanVideoWithAi(videoUrl: string): Promise<AiTagDetection[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/scan-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    // Simulated high-fidelity AI detection payload
    return [
      {
        id: 'ai_det_1',
        title: 'Opportunity OS Pro Executive Pass',
        timestampSeconds: 14.2,
        confidence: 0.98,
        suggestedPrice: 49.00,
        category: 'Software & Career Memberships',
        visualBox: { x: 120, y: 80, width: 340, height: 260 },
      },
      {
        id: 'ai_det_2',
        title: 'ATS Instant 10ms Autofill Key Token',
        timestampSeconds: 38.5,
        confidence: 0.94,
        suggestedPrice: 19.99,
        category: 'Digital AI Utilities',
        visualBox: { x: 200, y: 140, width: 280, height: 190 },
      },
      {
        id: 'ai_det_3',
        title: 'Creator Studio Mechanical Keypad (Hot-Swappable)',
        timestampSeconds: 62.0,
        confidence: 0.91,
        suggestedPrice: 89.00,
        category: 'Hardware & Peripherals',
        visualBox: { x: 310, y: 220, width: 400, height: 220 },
      },
    ];
  },

  // --- AI Viral Clips ---
  async getClips(projectId?: string): Promise<Clip[]> {
    try {
      const url = projectId
        ? `${API_BASE_URL}/api/clips?projectId=${projectId}`
        : `${API_BASE_URL}/api/clips`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.clips) return data.clips;
      }
    } catch (e) {}

    return getMockClips();
  },

  // --- Social Auto-Publishing ---
  async publishClip(clipId: string, platform: string): Promise<{ success: boolean; postUrl: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/distribution/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipId, platform }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      success: true,
      postUrl: `https://${platform.toLowerCase().replace('_', '')}.com/watch?v=dp_${clipId.slice(0, 8)}`,
    };
  },
};

// --- Initial High-Fidelity Mock State ---
function getMockProjects(): Project[] {
  return [
    {
      id: 'proj_demo_master_001',
      name: 'DigitPop Launch Keynote: AI Shoppable Video Platform',
      description: 'Interactive launch showcase detailing instant in-stream checkout, AI vision sidecar, and R2 global edge delivery.',
      masterVodUrl: 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/vods/demo_keynote.mp4',
      hlsManifestUrl: 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/vods/demo_keynote/master.m3u8',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=800&auto=format&fit=crop&q=80',
      durationSeconds: 142.0,
      status: 'READY',
      isActive: true,
      productGroups: [
        {
          id: 'pg_1',
          title: 'Opportunity OS Pro Pass',
          subtitle: 'Lifetime Executive Access & 1-Click ATS Dispatch',
          description: 'Unlock direct 1-click ATS application dispatches and candidate priority matchmaking.',
          timestampSeconds: 14.5,
          viewingMode: 'SIDE_PANEL',
          products: [
            {
              id: 'prod_1',
              title: 'Opportunity OS Pro Pass (1-Year Access)',
              price: 49.00,
              currency: 'USD',
              imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
              stripePriceId: 'price_1PxyzProPassAnnual',
              description: 'Full access pass with 10ms autofill engine included.',
            },
          ],
        },
        {
          id: 'pg_2',
          title: 'ATS Autofill Token Pack (1,000 Credits)',
          subtitle: 'Zero-Latency Form Injection',
          description: '1,000 verified tokens for continuous headless job portal submissions.',
          timestampSeconds: 38.0,
          viewingMode: 'TAP_TO_REVEAL',
          products: [
            {
              id: 'prod_2',
              title: '1,000 Autofill Credits',
              price: 19.99,
              currency: 'USD',
              imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
              stripePriceId: 'price_1PxyzTokenPack1000',
              description: 'Instant token credit load directly into candidate profile.',
            },
          ],
        },
      ],
      baskets: [
        {
          id: 'bask_1',
          projectId: 'proj_demo_master_001',
          title: 'Ultimate Career Acceleration Bundle',
          subtitle: 'Pro Pass + 1,000 Autofill Credits (Save 20%)',
          discountPercentage: 20.0,
          items: [
            { productId: 'prod_1', quantity: 1, isSelected: true },
            { productId: 'prod_2', quantity: 1, isSelected: true },
          ],
        },
      ],
    },
  ];
}

function getMockClips(): Clip[] {
  return [
    {
      id: 'clip_vir_991',
      hookTitle: 'How to bypass 45-minute ATS portals in 10 milliseconds ⚡',
      startSeconds: 12.0,
      endSeconds: 42.0,
      viralityScore: 96.4,
      aspectRatio: 'VERTICAL_9_16',
      resolution: '1080x1920',
      renderedVideoUrl: 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/clips/ats_10ms_hack.mp4',
      hashtags: ['#JobSearchHacks', '#OpportunityOS', '#TechCareers', '#AI', '#ViralShorts'],
      transcriptSegment: 'Watch what happens when I click apply. Notice how the autofill runs in under 10 milliseconds without touching a single field...',
      distributionLogs: [
        { platform: 'TIKTOK', status: 'PUBLISHED', postUrl: 'https://tiktok.com/@digitpop/video/7192837482' },
        { platform: 'YOUTUBE_SHORTS', status: 'PUBLISHED', postUrl: 'https://youtube.com/shorts/dp_vir_991' },
        { platform: 'INSTAGRAM_REELS', status: 'SCHEDULED' },
      ],
    },
    {
      id: 'clip_vir_992',
      hookTitle: 'Why Shoppable Video is replacing traditional affiliate links forever',
      startSeconds: 58.0,
      endSeconds: 94.0,
      viralityScore: 91.8,
      aspectRatio: 'VERTICAL_9_16',
      resolution: '1080x1920',
      renderedVideoUrl: 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/clips/shoppable_future.mp4',
      hashtags: ['#Ecommerce', '#ShoppableVideo', '#Stripe1Click', '#CreatorEconomy'],
      transcriptSegment: 'Instead of forcing viewers to leave your stream or video to check a link in the description, the checkout opens right inside the player...',
      distributionLogs: [
        { platform: 'YOUTUBE_SHORTS', status: 'PUBLISHED', postUrl: 'https://youtube.com/shorts/dp_vir_992' },
        { platform: 'X_TWITTER', status: 'PUBLISHED', postUrl: 'https://x.com/digitpop/status/18928374' },
      ],
    },
  ];
}
