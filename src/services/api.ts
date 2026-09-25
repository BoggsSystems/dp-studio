import { Project, Clip, AiTagDetection, User, Campaign, StreamSession, ProductGroup, ViewingMode, Product } from '../types';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:9000'
    : 'https://digitpop.opportunity-system.com')
).replace(/\/+$/, '');
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
          return serverProducts.map((p: any) => ({
            ...p,
            price: Number(p.price || 0),
          }));
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
    const images = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls
      : (product.imageUrl ? [product.imageUrl] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80']);
    const primaryImg = product.imageUrl || images[0];

    const newProduct: Product = {
      id: product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: product.title || 'Untitled Product',
      price: product.price ?? 29.99,
      currency: product.currency || 'USD',
      imageUrl: primaryImg,
      imageUrls: images,
      description: product.description || '',
      stripePriceId: product.stripePriceId || '',
      externalUrl: product.externalUrl || '',
      source: product.source || 'CUSTOM',
      checkoutType: product.checkoutType || (product.source === 'AMAZON' ? 'AMAZON' : product.source === 'SHOPIFY' ? 'SHOPIFY' : product.source === 'STRIPE' ? 'NATIVE_STRIPE' : 'NATIVE_STRIPE'),
      buttonTextOverride: product.buttonTextOverride || '',
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
      if (!res.ok) {
        if (res.status === 401) {
          return [];
        }
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.warn('Projects fetch failed:', e);
      return [];
    }
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
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
      const data = await res.json();
      return {
        ...data,
        productGroups: data.productGroups || [],
        baskets: data.baskets || [],
      };
    } catch (e) {
      console.warn('Simulating offline project save:', e);
      return {
        ...project,
        id: project.id || `proj_${Date.now()}`,
        status: project.status || 'READY',
        isActive: true,
        productGroups: project.productGroups || [],
        baskets: project.baskets || [],
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

  // --- High-Speed Resilient Parallel Chunked Ingress (4MB Slices, Multi-Worker, Auto-Retry) ---
  async uploadMedia(
    file: File,
    pathPrefix: string = 'vods',
    onProgress?: (progress: { percent: number; loadedBytes: number; totalBytes: number; loadedMb: string; totalMb: string } | number) => void
  ): Promise<{ url: string; key: string }> {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const cleanPrefix = pathPrefix.replace(/^\/+/, '').replace(/\/+$/, '');
    const targetKey = `${cleanPrefix}/${filename}`;
    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const contentType = file.type || 'video/mp4';

    const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per slice for maximum network stability
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const totalBytes = file.size;
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

    const chunkProgress = new Array(totalChunks).fill(0);
    let finalUrl = `${R2_PUBLIC_DOMAIN}/${targetKey}`;

    const updateOverallProgress = () => {
      if (!onProgress) return;
      const currentTotalLoaded = chunkProgress.reduce((sum, val) => sum + val, 0);
      const percent = Math.min(99, Math.round((currentTotalLoaded / totalBytes) * 100));
      const loadedMb = (currentTotalLoaded / (1024 * 1024)).toFixed(1);
      try {
        (onProgress as any)({ percent, loadedBytes: currentTotalLoaded, totalBytes, loadedMb, totalMb });
      } catch {
        (onProgress as any)(percent);
      }
    };

    const uploadSingleChunkWithRetry = async (chunkIndex: number, maxRetries = 3): Promise<void> => {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalBytes);
      const chunkBlob = file.slice(start, end);

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await new Promise<void>((resolve, reject) => {
            const formData = new FormData();
            formData.append('chunk', chunkBlob, `chunk_${chunkIndex}.bin`);
            formData.append('uploadId', uploadId);
            formData.append('chunkIndex', String(chunkIndex));
            formData.append('totalChunks', String(totalChunks));
            formData.append('key', targetKey);
            formData.append('contentType', contentType);

            const xhr = new XMLHttpRequest();
            xhr.timeout = 45000; // 45 second timeout per 4MB slice

            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                chunkProgress[chunkIndex] = e.loaded;
                updateOverallProgress();
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const resData = JSON.parse(xhr.responseText);
                  if (resData.url) {
                    finalUrl = resData.url;
                  }
                } catch {}
                chunkProgress[chunkIndex] = chunkBlob.size;
                updateOverallProgress();
                resolve();
              } else {
                reject(new Error(`HTTP ${xhr.status}`));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error('Network connection error'));
            });

            xhr.addEventListener('timeout', () => {
              reject(new Error('Chunk upload timed out after 45s'));
            });

            xhr.addEventListener('abort', () => {
              reject(new Error('Upload aborted'));
            });

            xhr.open('POST', `${API_BASE_URL}/api/publisher/shorts/upload-chunk`);
            xhr.send(formData);
          });
          return; // Successfully uploaded chunk
        } catch (err: any) {
          if (attempt === maxRetries) {
            throw new Error(`Chunk ${chunkIndex + 1}/${totalChunks} failed after ${maxRetries + 1} attempts: ${err.message}`);
          }
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 4000);
          console.warn(`[ChunkUploader] Chunk ${chunkIndex + 1}/${totalChunks} retry ${attempt + 1}/${maxRetries} in ${backoffMs}ms...`);
          chunkProgress[chunkIndex] = 0;
          updateOverallProgress();
          await new Promise((r) => setTimeout(r, backoffMs));
        }
      }
    };

    // Parallel Multi-Worker Queue (3 concurrent workers)
    const MAX_CONCURRENT = 3;
    const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
    let currentIndex = 0;

    const worker = async (): Promise<void> => {
      while (currentIndex < chunkIndices.length) {
        const indexToUpload = currentIndex++;
        await uploadSingleChunkWithRetry(indexToUpload);
      }
    };

    const workerPromises: Promise<void>[] = [];
    const activeWorkers = Math.min(MAX_CONCURRENT, totalChunks);
    for (let w = 0; w < activeWorkers; w++) {
      workerPromises.push(worker());
    }

    await Promise.all(workerPromises);

    if (onProgress) {
      try {
        (onProgress as any)({ percent: 100, loadedBytes: totalBytes, totalBytes, loadedMb: totalMb, totalMb });
      } catch {
        (onProgress as any)(100);
      }
    }

    return {
      url: finalUrl,
      key: targetKey,
    };
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

  // --- AI Transcription with Groq Whisper Large v3 Turbo ---
  async transcribeVideo(file: File | Blob, filename = 'audio.mp3'): Promise<{
    text: string;
    duration: number;
    language: string;
    words: Array<{ word: string; start: number; end: number }>;
    segments?: any[];
  }> {
    const formData = new FormData();
    formData.append('file', file, filename);

    const targetUrl = `${API_BASE_URL}/api/videos/transcribe`;
    console.log(`🎙️ [dp-studio] Sending audio to ${targetUrl}...`);

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ [dp-studio] Backend transcription succeeded:', data);
        return data;
      }
      const errJson = await res.json().catch(() => ({}));
      console.warn('Backend transcription returned error status:', res.status, errJson);
    } catch (e) {
      console.warn('Backend transcription network failed, attempting direct Groq fallback:', e);
    }

    // Direct Groq fallback for zero-latency client-side processing
    const groqKey = import.meta.env.VITE_GROQ_API_KEY || (typeof window !== 'undefined' ? (window as any).__GROQ_API_KEY__ : '') || '';
    if (!groqKey) {
      throw new Error(`Transcription failed: Could not connect to ${targetUrl}.`);
    }
    const groqForm = new FormData();
    groqForm.append('file', file, filename);
    groqForm.append('model', 'whisper-large-v3-turbo');
    groqForm.append('response_format', 'verbose_json');
    groqForm.append('timestamp_granularities[]', 'word');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
      body: groqForm,
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({ error: { message: 'Transcription failed' } }));
      throw new Error(err.error?.message || `Groq HTTP ${groqRes.status}`);
    }

    return await groqRes.json();
  },

  // --- Social Multi-Channel Distribution & YouTube Publishing ---
  async getSocialAccounts(): Promise<Array<{ platform: string; accountName?: string; accountId?: string; avatarUrl?: string; createdAt: string }>> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/social/accounts`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  getYouTubeAuthUrl(origin?: string): string {
    const clientOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://studio.opportunity-system.com');
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const redirectUri = 'https://digitpop.opportunity-system.com/api/social/auth/youtube/callback';
    const clientId = '162204893839-dfcn0b0j2tek36j07271i8edqkefkng7.apps.googleusercontent.com';
    const state = typeof btoa !== 'undefined' ? btoa(JSON.stringify({ origin: clientOrigin })) : '';
    const params = new URLSearchParams({
      redirect_uri: redirectUri,
      client_id: clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      state,
    });
    return `${rootUrl}?${params.toString()}`;
  },

  async disconnectSocialAccount(platform: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/social/accounts/${platform}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async publishYouTubeShort(
    payload: {
      videoBlob: Blob;
      thumbnailBlob?: Blob;
      title: string;
      description: string;
      tags?: string[];
      privacy?: 'public' | 'unlisted' | 'private';
    },
    onProgress?: (info: { stage: 'INITIALIZING' | 'UPLOADING' | 'SETTING_THUMBNAIL' | 'DONE'; percent: number; loadedBytes?: number; totalBytes?: number }) => void
  ): Promise<{ success: boolean; videoId: string; url: string; title: string }> {
    try {
      // Stage 1: Request Direct Google Resumable Upload Session URL from Backend
      if (onProgress) onProgress({ stage: 'INITIALIZING', percent: 5 });

      const clientOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://studio.opportunity-system.com';
      const sessionRes = await fetch(`${API_BASE_URL}/api/social/youtube/create-upload-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          tags: payload.tags,
          privacy: payload.privacy,
          contentLength: payload.videoBlob.size,
          origin: clientOrigin,
        }),
      });

      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({ message: 'Failed to create YouTube upload session' }));
        throw new Error(err.message || `Session initialization failed (HTTP ${sessionRes.status})`);
      }

      const { uploadUrl, formattedTitle } = await sessionRes.json();
      if (!uploadUrl) {
        throw new Error('No Google upload URL returned from backend');
      }

      // Stage 2: Stream Video Directly to Google YouTube Cloud Storage
      if (onProgress) onProgress({ stage: 'UPLOADING', percent: 10, loadedBytes: 0, totalBytes: payload.videoBlob.size });

      const videoId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', 'video/mp4');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const uploadPercent = Math.min(95, Math.round((event.loaded / event.total) * 90) + 5);
            onProgress({
              stage: 'UPLOADING',
              percent: uploadPercent,
              loadedBytes: event.loaded,
              totalBytes: event.total,
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resData = JSON.parse(xhr.responseText);
              if (resData.id) {
                resolve(resData.id);
              } else {
                reject(new Error('YouTube upload completed but video ID was missing in response.'));
              }
            } catch (e) {
              reject(new Error('Failed to parse YouTube upload response JSON.'));
            }
          } else {
            reject(new Error(`YouTube upload failed with HTTP ${xhr.status}: ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error occurred while uploading directly to YouTube.'));
        };

        xhr.ontimeout = () => {
          reject(new Error('YouTube upload connection timed out.'));
        };

        xhr.send(payload.videoBlob);
      });

      // Stage 3: Attach Custom High-CTR Thumbnail if provided
      if (payload.thumbnailBlob) {
        if (onProgress) onProgress({ stage: 'SETTING_THUMBNAIL', percent: 96 });
        try {
          const thumbFormData = new FormData();
          thumbFormData.append('thumbnail', payload.thumbnailBlob, 'thumbnail.jpg');
          thumbFormData.append('videoId', videoId);

          await fetch(`${API_BASE_URL}/api/social/youtube/set-thumbnail`, {
            method: 'POST',
            body: thumbFormData,
          });
        } catch (thumbErr) {
          console.warn('Custom thumbnail attachment warning:', thumbErr);
        }
      }

      if (onProgress) onProgress({ stage: 'DONE', percent: 100 });

      return {
        success: true,
        videoId,
        url: `https://youtube.com/shorts/${videoId}`,
        title: formattedTitle || payload.title,
      };
    } catch (err: any) {
      console.error('Direct YouTube Upload Error:', err);
      throw err;
    }
  },

  getTikTokAuthUrl(origin?: string): string {
    const clientOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://studio.opportunity-system.com');
    const rootUrl = 'https://www.tiktok.com/v2/auth/authorize/';
    const clientKey = 'sbaw8pzk13d1hkz300';
    const redirectUri = 'https://digitpop.opportunity-system.com/api/social/auth/tiktok/callback';
    const state = typeof btoa !== 'undefined' ? btoa(JSON.stringify({ origin: clientOrigin })) : '';
    const params = new URLSearchParams({
      client_key: clientKey,
      scope: 'user.info.basic,video.upload',
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
    });
    return `${rootUrl}?${params.toString()}`;
  },

  async publishTikTokVideo(
    payload: {
      videoBlob: Blob;
      title: string;
      privacy?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
    },
    onProgress?: (info: { stage: 'INITIALIZING' | 'UPLOADING' | 'DONE'; percent: number; loadedBytes?: number; totalBytes?: number }) => void
  ): Promise<{ success: boolean; publishId: string; url: string; title: string }> {
    try {
      if (onProgress) onProgress({ stage: 'INITIALIZING', percent: 10 });

      const formData = new FormData();
      formData.append('video', payload.videoBlob, 'tiktok_short.mp4');
      formData.append('title', payload.title);
      if (payload.privacy) formData.append('privacy', payload.privacy);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/social/publish/tiktok`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.min(95, Math.round((event.loaded / event.total) * 85) + 10);
            onProgress({
              stage: 'UPLOADING',
              percent,
              loadedBytes: event.loaded,
              totalBytes: event.total,
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (onProgress) onProgress({ stage: 'DONE', percent: 100 });
              resolve({
                success: true,
                publishId: res.publishId || 'tiktok_pub_ok',
                url: res.url || 'https://www.tiktok.com',
                title: payload.title,
              });
            } catch (e) {
              resolve({
                success: true,
                publishId: 'tiktok_pub_ok',
                url: 'https://www.tiktok.com',
                title: payload.title,
              });
            }
          } else {
            let errorMsg = `TikTok upload failed (HTTP ${xhr.status})`;
            try {
              const res = JSON.parse(xhr.responseText);
              errorMsg = res.message || res.error || errorMsg;
            } catch (e) {}
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error uploading video to TikTok.'));
        };

        xhr.send(formData);
      });
    } catch (err: any) {
      console.error('Direct TikTok Upload Error:', err);
      throw err;
    }
  },

  // --- Instagram Reels (Meta Graph API) ---
  getInstagramAuthUrl(origin?: string): string {
    const clientOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://studio.opportunity-system.com');
    const rootUrl = 'https://www.facebook.com/v19.0/dialog/oauth';
    const appId = '1142058290382910';
    const redirectUri = 'https://digitpop.opportunity-system.com/api/social/auth/instagram/callback';
    const state = typeof btoa !== 'undefined' ? btoa(JSON.stringify({ origin: clientOrigin })) : '';
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      response_type: 'code',
      state,
    });
    return `${rootUrl}?${params.toString()}`;
  },

  async publishInstagramReel(
    payload: {
      videoBlob: Blob;
      title: string;
      caption?: string;
    },
    onProgress?: (info: { stage: 'INITIALIZING' | 'UPLOADING' | 'DONE'; percent: number }) => void
  ): Promise<{ success: boolean; mediaId: string; url: string; title: string }> {
    try {
      if (onProgress) onProgress({ stage: 'INITIALIZING', percent: 15 });

      const formData = new FormData();
      formData.append('video', payload.videoBlob, 'instagram_reel.mp4');
      formData.append('title', payload.title);
      if (payload.caption) formData.append('caption', payload.caption);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/social/publish/instagram`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.min(95, Math.round((event.loaded / event.total) * 80) + 15);
            onProgress({ stage: 'UPLOADING', percent });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (onProgress) onProgress({ stage: 'DONE', percent: 100 });
              resolve(res);
            } catch (e) {
              resolve({
                success: true,
                mediaId: 'ig_reel_ok',
                url: 'https://instagram.com/reels',
                title: payload.title,
              });
            }
          } else {
            let errorMsg = `Instagram upload failed (${xhr.status})`;
            try {
              const res = JSON.parse(xhr.responseText);
              errorMsg = res.message || res.error || errorMsg;
            } catch (e) {}
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => reject(new Error('Network error uploading to Instagram'));
        xhr.send(formData);
      });
    } catch (err: any) {
      console.error('Direct Instagram Upload Error:', err);
      throw err;
    }
  },

  // --- X / Twitter (API v2) ---
  getTwitterAuthUrl(origin?: string): string {
    const clientOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://studio.opportunity-system.com');
    const rootUrl = 'https://twitter.com/i/oauth2/authorize';
    const clientId = 'twitter_client_id_placeholder';
    const redirectUri = 'https://digitpop.opportunity-system.com/api/social/auth/twitter/callback';
    const state = typeof btoa !== 'undefined' ? btoa(JSON.stringify({ origin: clientOrigin })) : '';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: 'challenge',
      code_challenge_method: 'plain',
    });
    return `${rootUrl}?${params.toString()}`;
  },

  async publishTwitterPost(
    payload: {
      videoBlob: Blob;
      text: string;
    },
    onProgress?: (info: { stage: 'INITIALIZING' | 'UPLOADING' | 'DONE'; percent: number }) => void
  ): Promise<{ success: boolean; tweetId: string; url: string; title: string }> {
    try {
      if (onProgress) onProgress({ stage: 'INITIALIZING', percent: 15 });

      const formData = new FormData();
      formData.append('video', payload.videoBlob, 'twitter_video.mp4');
      formData.append('text', payload.text);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/social/publish/twitter`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.min(95, Math.round((event.loaded / event.total) * 80) + 15);
            onProgress({ stage: 'UPLOADING', percent });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (onProgress) onProgress({ stage: 'DONE', percent: 100 });
              resolve(res);
            } catch (e) {
              resolve({
                success: true,
                tweetId: 'x_post_ok',
                url: 'https://x.com',
                title: payload.text,
              });
            }
          } else {
            let errorMsg = `X post failed (${xhr.status})`;
            try {
              const res = JSON.parse(xhr.responseText);
              errorMsg = res.message || res.error || errorMsg;
            } catch (e) {}
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => reject(new Error('Network error posting to X'));
        xhr.send(formData);
      });
    } catch (err: any) {
      console.error('Direct Twitter Upload Error:', err);
      throw err;
    }
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
      id: 'proj_opportunity_os_job_app',
      name: 'Opportunity OS Live Job Application Speedrun & Studio Setup',
      description: 'Live job application session featuring Opportunity OS automations, AI-Native Software Engineering book, and studio setup.',
      category: 'Software & Career',
      masterVodUrl: '/videos/opportunity-os-job-application.mov',
      thumbnailUrl: '/thumbnails/opportunity-os-job-application.jpg',
      durationSeconds: 398.97,
      status: 'READY',
      isActive: true,
      productGroups: [
        {
          id: 'pg_job_app_unified',
          title: 'Featured in Video & Studio Setup',
          subtitle: 'Opportunity OS Platform, AI-Native Engineering Book & Studio Lighting',
          description: 'Complete toolkit, literature, and studio gear shown throughout this live application session.',
          timestampSeconds: 0.0,
          viewingMode: 'SIDE_PANEL',
          products: [
            {
              id: 'prod_opportunity_os_platform',
              title: 'Opportunity OS — AI Job Search & Application Assistant',
              price: 59.00,
              currency: 'USD',
              imageUrl: '/thumbnails/opportunity-os-job-application.jpg',
              imageUrls: ['/thumbnails/opportunity-os-job-application.jpg'],
              externalUrl: 'https://opportunity-system.com/#/plans',
              checkoutType: 'EXTERNAL_LINK',
              buttonTextOverride: 'Choose Plan on Opportunity OS',
              variants: [
                { name: 'Plan Tier', value: 'Monthly Operator ($59/mo)', priceAdjustment: 0.00 },
                { name: 'Plan Tier', value: '3-Month Campaign Pass ($139 / 3 mos)', priceAdjustment: 80.00 },
                { name: 'Plan Tier', value: 'Free Explorer ($0/mo)', priceAdjustment: -59.00 },
              ],
            },
            {
              id: 'prod_ai_native_book',
              title: 'AI-Native Software Engineering: The New Physics of Software Velocity',
              price: 9.99,
              currency: 'USD',
              imageUrl: 'https://m.media-amazon.com/images/I/71-xK7vVlLL._SL1500_.jpg',
              imageUrls: [
                'https://m.media-amazon.com/images/I/71-xK7vVlLL._SL1500_.jpg',
                '/images/ai-native-software-engineering-cover.jpg',
              ],
              externalUrl: 'https://www.amazon.com/dp/B0GN3G2HTQ',
              checkoutType: 'AMAZON',
              buttonTextOverride: 'Buy on Amazon ($9.99 / $24.95)',
              variants: [
                { name: 'Format', value: 'Kindle Edition ($9.99)', priceAdjustment: 0.00 },
                { name: 'Format', value: 'Paperback ($24.95)', priceAdjustment: 14.96 },
              ],
            },
            {
              id: 'prod_miortior_rgb_lamp',
              title: 'Miortior Smart RGB LED Corner Floor Lamp',
              price: 39.99,
              currency: 'USD',
              imageUrl: '/images/miortior-corner-floor-lamp.jpg',
              imageUrls: ['/images/miortior-corner-floor-lamp.jpg'],
              externalUrl: 'https://www.amazon.com/dp/B0C2HDKZD7',
              checkoutType: 'AMAZON',
              buttonTextOverride: 'Buy on Amazon ($39.99)',
            },
          ],
        },
      ],
    },
    {
      id: 'proj_bavaria_luxury_001',
      name: 'Bavaria Alpine Luxury & Lifestyle Showcase',
      description: 'Interactive alpine lifestyle showcase with 1 product group featuring 6 handcrafted luxury products.',
      category: 'Luxury & Lifestyle',
      masterVodUrl: '/videos/test_showcase.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
      durationSeconds: 24.0,
      status: 'READY',
      isActive: true,
      productGroups: [
        {
          id: 'pg_alpine_luxury',
          title: 'Alpine Winter Essentials & Luxury Collection',
          subtitle: 'Curated 6-piece luxury ensemble for the Bavarian Alps',
          description: 'Handcrafted full-grain leather, Swiss mechanical horology, fine merino wool, and mountain lifestyle essentials.',
          timestampSeconds: 3.5,
          viewingMode: 'PAUSE_INSPECT',
          products: [
            {
              id: 'prod_bav_duffle',
              title: 'Bavarian Full-Grain Leather Duffle',
              price: 349.00,
              currency: 'USD',
              imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
              imageUrls: [
                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&auto=format&fit=crop&q=80',
              ],
              externalUrl: 'https://shop.example.com/bavarian-duffle',
              stripePriceId: 'price_bav_duffle',
              description: 'Vegetable-tanned Bavarian cowhide with solid brass YKK zippers and reinforced waterproof lining.',
            },
            {
              id: 'prod_bav_watch',
              title: 'Chronos Obsidian Automatic Watch',
              price: 289.00,
              currency: 'USD',
              imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
              imageUrls: [
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
              ],
              externalUrl: 'https://shop.example.com/chronos-watch',
              stripePriceId: 'price_bav_watch',
              description: 'Automatic self-winding Swiss mechanical movement with sapphire crystal and 100m water resistance.',
            },
            {
              id: 'prod_bav_sweater',
              title: 'Thermal Merino Wool Alpine Crew',
              price: 125.00,
              currency: 'USD',
              imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80',
              imageUrls: [
                'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80',
              ],
              externalUrl: 'https://shop.example.com/merino-sweater',
              stripePriceId: 'price_bav_sweater',
              description: '100% ultrafine New Zealand Merino wool with breathable ribbed cuffs and odor-resistant weave.',
            },
            {
              id: 'prod_bav_shades',
              title: 'Alpine Glacier Polarized Sunglasses',
              price: 165.00,
              currency: 'USD',
              imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
              imageUrls: [
                'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80',
              ],
              externalUrl: 'https://shop.example.com/glacier-shades',
              stripePriceId: 'price_bav_shades',
              description: 'Ultralight aerospace titanium frame with category-3 polarized anti-glare lenses for high altitude.',
            },
            {
              id: 'prod_bav_flask',
              title: 'Ceramic-Lined Alpine Thermal Flask',
              price: 48.00,
              currency: 'USD',
              imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
              imageUrls: [
                'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
              ],
              externalUrl: 'https://shop.example.com/thermal-flask',
              stripePriceId: 'price_bav_flask',
              description: 'Double-wall vacuum insulation keeps liquids steaming hot for 24 hours. Pure ceramic interior lining.',
            },
            {
              id: 'prod_bav_boots',
              title: 'Vibram-Sole Trailblazer Mountain Boots',
              price: 240.00,
              currency: 'USD',
              imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
              imageUrls: [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80',
              ],
              externalUrl: 'https://shop.example.com/trailblazer-boots',
              stripePriceId: 'price_bav_boots',
              description: 'Gore-Tex breathable waterproof membrane paired with Vibram Megagrip lugged outsoles for mountain terrain.',
            },
          ],
        },
      ],
    },
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
      imageUrls: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=400&auto=format&fit=crop&q=80',
      ],
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
      imageUrls: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&auto=format&fit=crop&q=80',
      ],
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
      imageUrls: [
        'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
      ],
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
      imageUrls: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80',
      ],
      externalUrl: 'https://amazon.com/dp/B0002E4Z8M',
      source: 'AMAZON',
      vendor: 'Shure',
      inventoryCount: 8,
    },
  ];
}

