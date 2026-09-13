import { Project, Clip, AiTagDetection, User, Campaign, StreamSession, ProductGroup, ViewingMode, Product } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:9000').replace(/\/+$/, '');
const R2_PUBLIC_DOMAIN = 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev';
const LOCAL_PRODUCTS_KEY = 'dp_studio_catalog_products';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('dp_studio_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // --- Auth ---
  async register(email: string, pass: string, fullName?: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, fullName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return await res.json();
  },

  async login(email: string, pass: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return await res.json();
  },

  async getMe(token: string): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch (e) {
      return null;
    }
  },

  // --- Central Products & Catalog ---
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const serverProducts = await res.json();
        if (Array.isArray(serverProducts) && serverProducts.length > 0) {
          return serverProducts;
        }
      }
    } catch (e) {
      console.warn('Backend products endpoint offline, falling back to local catalog store');
    }

    const local = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }

    const defaultCatalog = getDefaultCatalog();
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(defaultCatalog));
    return defaultCatalog;
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const newProduct: Product = {
      id: product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: product.title || 'Untitled Product',
      price: product.price ?? 29.99,
      currency: product.currency || 'USD',
      imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
      description: product.description || '',
      stripePriceId: product.stripePriceId || '',
      externalUrl: product.externalUrl || '',
      source: product.source || 'CUSTOM',
      vendor: product.vendor || 'In-House',
      inventoryCount: product.inventoryCount ?? 100,
      handle: product.handle,
      shopifyId: product.shopifyId,
      variants: product.variants || [],
    };

    try {
      await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newProduct),
      });
    } catch (e) {}

    const current = await this.getProducts();
    const updated = [newProduct, ...current.filter((p) => p.id !== newProduct.id)];
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updated));
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (e) {}

    const current = await this.getProducts();
    const updated = current.map((p) => (p.id === id ? { ...p, ...updates } : p));
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updated));
    return updated.find((p) => p.id === id)!;
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (e) {}

    const current = await this.getProducts();
    const filtered = current.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(filtered));
    return true;
  },

  // --- Dynamic E-Commerce & Shopify Ingest ---
  async resolveProductUrl(url: string): Promise<Partial<Product>> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/resolve-url`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const name = parsed.pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || 'Imported Product';
    return {
      title: name.charAt(0).toUpperCase() + name.slice(1),
      description: `Imported item from ${parsed.hostname}`,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
      price: 49.00,
      currency: 'USD',
      externalUrl: url,
      source: url.includes('shopify') ? 'SHOPIFY' : 'CUSTOM',
      vendor: parsed.hostname,
    };
  },

  async syncShopifyCatalog(storeUrl: string): Promise<{ success: boolean; store: string; count: number; products: Product[] }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/shopify-sync`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ storeUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        const current = await this.getProducts();
        const existingIds = new Set(current.map((p) => p.id));
        const newProducts = data.products.filter((p: Product) => !existingIds.has(p.id));
        const merged = [...newProducts, ...current];
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(merged));
        return data;
      }
    } catch (e) {}

    const domain = storeUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const demoItems: Product[] = [
      {
        id: `shopify_${Date.now()}_1`,
        title: `${domain} Pro Collection`,
        description: 'Auto-synchronized collection from Shopify storefront.',
        price: 59.00,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
        externalUrl: `https://${domain}/products/pro-collection`,
        source: 'SHOPIFY',
        vendor: domain,
        inventoryCount: 45,
      },
      {
        id: `shopify_${Date.now()}_2`,
        title: `${domain} Streamer Pass`,
        description: 'High-intent digital pass synchronized via Shopify Storefront.',
        price: 29.00,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
        externalUrl: `https://${domain}/products/streamer-pass`,
        source: 'SHOPIFY',
        vendor: domain,
        inventoryCount: 120,
      },
    ];

    const current = await this.getProducts();
    const merged = [...demoItems, ...current];
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(merged));

    return {
      success: true,
      store: domain,
      count: demoItems.length,
      products: demoItems,
    };
  },

  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Falling back to local cache or seed projects');
      return getMockProjects();
    }
  },

  async getProject(id: string): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        headers: getAuthHeaders(),
      });
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
        headers: getAuthHeaders(),
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

  async deleteProject(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.ok;
    } catch (e) {
      return true;
    }
  },

  // --- Cloudflare R2 Upload ---
  async uploadMedia(
    file: File,
    pathPrefix: string = 'vods',
    onProgress?: (pct: number) => void
  ): Promise<{ url: string; key: string }> {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const key = `${pathPrefix}/${filename}`;
    const destinationUrl = `${R2_PUBLIC_DOMAIN}/${key}`;

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
          resolve({ url: destinationUrl, key });
        });
        xhr.addEventListener('error', () => {
          resolve({ url: destinationUrl, key });
        });
      });

      xhr.open('POST', `${API_BASE_URL}/api/storage/upload`);
      xhr.send(formData);
      return await uploadPromise;
    } catch (err) {
      return { url: destinationUrl, key };
    }
  },

  // --- AI Autopilot Scanner ---
  async scanVideoWithAi(videoUrl: string): Promise<AiTagDetection[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/scan-vod`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ videoUrl }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return [
        {
          id: 'det_1',
          title: 'Opportunity OS Pro Pass',
          timestampSeconds: 14.5,
          confidence: 0.98,
          suggestedPrice: 49.00,
          category: 'Software Pass',
        },
        {
          id: 'det_2',
          title: 'AI-Native Software Engineering (Kindle Book)',
          timestampSeconds: 38.0,
          confidence: 0.94,
          suggestedPrice: 9.99,
          category: 'Digital Publication',
        },
        {
          id: 'det_3',
          title: '1,000 Autofill Credits Bundle',
          timestampSeconds: 62.0,
          confidence: 0.91,
          suggestedPrice: 19.99,
          category: 'Token Pack',
        },
      ];
    }
  },

  // --- Clips & 9:16 Shorts ---
  async getClips(_projectId?: string): Promise<Clip[]> {
    return getMockClips();
  },

  async publishClip(clipId: string, platform: string): Promise<{ success: boolean; postUrl: string }> {
    return {
      success: true,
      postUrl: `https://${platform.toLowerCase().replace('_', '')}.com/post/${clipId}`,
    };
  },

  // --- Livestream Sessions ---
  async getStreamSessions(): Promise<StreamSession[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stream/sessions`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return getMockStreamSessions();
    }
  },

  async createStreamSession(title: string, streamKey?: string): Promise<StreamSession> {
    const key = streamKey || `live_${Date.now().toString(36)}`;
    try {
      const res = await fetch(`${API_BASE_URL}/api/stream/session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          streamKey: key,
          whipIngestUrl: `rtmp://localhost:1985/live/${key}`,
          hlsPlaybackUrl: `http://localhost:8080/live/${key}.m3u8`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return {
        id: `sess_${Date.now()}`,
        title,
        streamKey: key,
        whipIngestUrl: `rtmp://localhost:1985/live/${key}`,
        hlsPlaybackUrl: `http://localhost:8080/live/${key}.m3u8`,
        status: 'CREATED',
        createdAt: new Date().toISOString(),
      };
    }
  },

  async updateStreamSession(sessionId: string, updates: Partial<StreamSession>): Promise<StreamSession> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stream/session/${sessionId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return {
        id: sessionId,
        title: 'Livestream Session',
        streamKey: 'live_session',
        status: updates.status || 'LIVE',
        ...updates,
      } as StreamSession;
    }
  },

  async triggerLiveOverlay(sessionId: string, payload: any, viewingMode: ViewingMode = 'SIDE_PANEL') {
    try {
      await fetch(`${API_BASE_URL}/api/stream/session/${sessionId}/trigger`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productGroupId: payload.id || payload.productGroupId,
          timestampSeconds: payload.timestampSeconds || 0,
          viewingMode,
          productGroup: payload,
          ...payload,
        }),
      });
    } catch (e) {
      console.warn('Simulating live overlay trigger:', e);
    }
  },

  // --- Campaigns ---
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/enterprise/all`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.campaigns || getMockCampaigns();
    } catch (e) {
      return getMockCampaigns();
    }
  },

  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/enterprise/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(campaign),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return {
        ...campaign,
        id: `camp_${Date.now()}`,
        status: 'ACTIVE',
        impressions: 0,
        clicks: 0,
        brandRecallRate: 0,
        totalSpent: 0,
      } as Campaign;
    }
  },
};

function getMockProjects(): Project[] {
  return [
    {
      id: 'proj_demo_master_001',
      name: 'Executive AI Engineering & ATS Automation Showcase',
      description: 'Zero-latency ATS profile autofill demonstration with live shoppable moment triggers.',
      category: 'Software & Technology',
      masterVodUrl: 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/vods/demo_presentation.mp4',
      hlsManifestUrl: 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/vods/demo_presentation.m3u8',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      durationSeconds: 142.5,
      status: 'READY',
      isActive: true,
      productGroups: [
        {
          id: 'pg_1',
          title: 'Opportunity OS Pro Pass (1-Year Access)',
          subtitle: 'Sub-10ms Headless Form Injection',
          description: 'Unlock infinite ATS auto-submissions with verified candidate credentials.',
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

function getMockStreamSessions(): StreamSession[] {
  return [
    {
      id: 'sess_live_001',
      title: 'Executive AI Engineering & ATS Automation Livestream',
      streamKey: 'jeff_speedrun',
      whipIngestUrl: 'rtmp://localhost:1985/live/jeff_speedrun',
      hlsPlaybackUrl: 'http://localhost:8080/live/jeff_speedrun.m3u8',
      status: 'LIVE',
      scheduledAt: new Date().toISOString(),
    },
    {
      id: 'sess_live_002',
      title: 'AI-Native Physics & Software Velocity Book Launch',
      streamKey: 'book_launch_2026',
      whipIngestUrl: 'rtmp://localhost:1985/live/book_launch_2026',
      hlsPlaybackUrl: 'http://localhost:8080/live/book_launch_2026.m3u8',
      status: 'CREATED',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    },
  ];
}

function getMockCampaigns(): Campaign[] {
  return [
    {
      id: 'camp_001',
      name: 'Opportunity OS Q3 Engineering Blitz',
      projectId: 'proj_demo_master_001',
      projectName: 'Executive AI Engineering & ATS Automation Showcase',
      category: 'Software & Technology',
      budgetAmount: 2500.0,
      dailyBudgetLimit: 150.0,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      biddingModel: 'COMPREHENSION',
      verificationQuestion: 'What is the benchmark submission latency of the Opportunity OS Autofill Engine?',
      verificationOptions: ['10 milliseconds', '45 seconds', '5 minutes', '24 hours'],
      correctOptionIndex: 0,
      status: 'ACTIVE',
      impressions: 48210,
      clicks: 3410,
      brandRecallRate: 88.5,
      totalSpent: 1140.0,
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
  ];
}

function getDefaultCatalog(): Product[] {
  return [
    {
      id: 'prod_opp_pass',
      title: 'Opportunity OS Pro Pass',
      description: '1-Click Profile Autofill & ATS Resume Injection Engine. Sub-10ms latency.',
      price: 49.00,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
      stripePriceId: 'price_pro_pass',
      externalUrl: 'https://app.opportunityos.com/checkout?priceId=price_pro_pass',
      source: 'STRIPE',
      vendor: 'Opportunity OS',
      inventoryCount: 999,
    },
    {
      id: 'prod_founder_tshirt',
      title: 'DigitPop Founder Heavyweight Tee',
      description: 'Custom 280gsm heavyweight cotton shirt with embroidered reflective logo.',
      price: 34.00,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
      externalUrl: 'https://shop.digitpop.com/products/founder-tee',
      source: 'SHOPIFY',
      vendor: 'DigitPop Apparel',
      inventoryCount: 85,
    },
    {
      id: 'prod_studio_light',
      title: 'Elgato Key Light Air Live Streaming Panel',
      description: 'Wi-Fi enabled 1400 lumen studio desk light with multi-layer diffusion.',
      price: 129.99,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&auto=format&fit=crop&q=80',
      externalUrl: 'https://amazon.com/dp/B082QHRZHM',
      source: 'AMAZON',
      vendor: 'Amazon / Elgato',
      inventoryCount: 15,
    },
    {
      id: 'prod_shure_mic',
      title: 'Shure SM7B Cardioid Dynamic Microphone',
      description: 'Legendary broadcast vocal microphone with smooth, flat, wide-range frequency response.',
      price: 399.00,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80',
      externalUrl: 'https://amazon.com/dp/B0002E4Z8M',
      source: 'AMAZON',
      vendor: 'Shure',
      inventoryCount: 8,
    },
  ];
}

