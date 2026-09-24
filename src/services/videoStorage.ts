/**
 * Persistent IndexedDB Video & Draft Cache
 * Enables instant recovery of large video files (500MB+) and editing sessions across page reloads.
 */

const DB_NAME = 'digitpop_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'video_drafts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraftVideoBlob(blob: Blob, name: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(
      {
        blob,
        name,
        type: blob.type,
        size: blob.size,
        updatedAt: Date.now(),
      },
      'active_short_video'
    );

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save video to IndexedDB:', err);
  }
}

export async function getDraftVideoBlob(): Promise<{ blob: Blob; name: string } | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('active_short_video');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const res = request.result;
        if (res && res.blob) {
          resolve({ blob: res.blob, name: res.name || 'uploaded_video.mp4' });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to retrieve video from IndexedDB:', err);
    return null;
  }
}

import { FormattedShortProject } from '../types';

export async function clearDraftVideoBlob(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('active_short_video');

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear video from IndexedDB:', err);
  }
}

// ---------------------------------------------------------------------------
// Multi-Project Shorts Library (IndexedDB & LocalStorage Sync)
// ---------------------------------------------------------------------------

const SHORTS_LIBRARY_KEY = 'digitpop_saved_shorts_library_v1';
const DELETED_SHORTS_KEY = 'digitpop_deleted_shorts_v1';

function getDeletedShortIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_SHORTS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch (e) {
    return new Set();
  }
}

function addDeletedShortId(id: string) {
  try {
    const set = getDeletedShortIds();
    set.add(id);
    localStorage.setItem(DELETED_SHORTS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

function removeDeletedShortId(id: string) {
  try {
    const set = getDeletedShortIds();
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem(DELETED_SHORTS_KEY, JSON.stringify(Array.from(set)));
    }
  } catch (e) {}
}

export async function createCloudShortProject(
  title?: string,
  creatorSlug: string = 'opportunity-system',
  channel: string = 'about'
): Promise<string> {
  try {
    const apiBase = (
      (import.meta as any).env?.VITE_API_URL ||
      (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:9000'
        : 'https://digitpop.opportunity-system.com')
    ).replace(/\/+$/, '');

    const res = await fetch(`${apiBase}/api/publisher/shorts/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, creatorSlug, channel }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.projectId) {
        return data.projectId;
      }
    }
  } catch (err) {
    console.warn('Failed to allocate cloud short project UUID:', err);
  }
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`;
}

export async function saveShortDraftToCloud(
  short: FormattedShortProject,
  videoBlob?: Blob,
  thumbBlob?: Blob
): Promise<{ success: boolean; shortId?: string; videoUrl?: string; thumbnailUrl?: string }> {
  try {
    if (short.status === 'PUBLISHED') {
      return { success: true, shortId: short.id, videoUrl: short.videoUrl, thumbnailUrl: short.thumbnailUrl };
    }

    const apiBase = (
      (import.meta as any).env?.VITE_API_URL ||
      (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:9000'
        : 'https://digitpop.opportunity-system.com')
    ).replace(/\/+$/, '');

    let videoUrl = short.videoUrl;
    let thumbnailUrl = short.thumbnailUrl;

    // Direct presigned upload if video blob is present
    if (videoBlob) {
      try {
        const presignRes = await fetch(
          `${apiBase}/api/publisher/shorts/presigned-url?shortId=${encodeURIComponent(short.id)}&fileType=video&creatorSlug=opportunity-system`
        );
        if (presignRes.ok) {
          const presignData = await presignRes.json();
          if (presignData.uploadUrl) {
            const putRes = await fetch(presignData.uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': videoBlob.type || 'video/mp4' },
              body: videoBlob,
            });
            if (putRes.ok && presignData.publicUrl) {
              videoUrl = presignData.publicUrl;
            }
          }
        }
      } catch (e) {
        console.warn('Presigned draft video upload error:', e);
      }
    }

    const payload = {
      ...short,
      videoUrl,
      thumbnailUrl,
      creatorSlug: 'opportunity-system',
      destinationChannel: 'about',
    };

    const resp = await fetch(`${apiBase}/api/publisher/shorts/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (resp.ok) {
      const data = await resp.json();
      return { success: true, shortId: data.shortId || short.id, videoUrl, thumbnailUrl };
    }
    return { success: false };
  } catch (err) {
    console.warn('saveShortDraftToCloud error:', err);
    return { success: false };
  }
}

export async function fetchCloudLibraryShorts(creatorSlug: string = 'opportunity-system'): Promise<FormattedShortProject[]> {
  try {
    const apiBase = (
      (import.meta as any).env?.VITE_API_URL ||
      (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:9000'
        : 'https://digitpop.opportunity-system.com')
    ).replace(/\/+$/, '');

    const res = await fetch(`${apiBase}/api/publisher/shorts/library?creatorSlug=${encodeURIComponent(creatorSlug)}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.shorts)) return [];

    return data.shorts.map((s: any) => {
      const meta = s.metadata || {};
      return {
        id: s.id,
        clientShortId: s.clientShortId || meta.clientShortId || s.id,
        title: s.title || meta.thumbnailTitle || 'AI Shoppable Short',
        videoFileName: meta.videoFileName || `${s.id}.mp4`,
        videoUrl: s.videoUrl,
        thumbnailUrl: s.thumbnailUrl,
        durationSeconds: s.durationSeconds || 30,
        words: meta.transcript || [],
        editableTranscript: meta.editableTranscript || '',
        highlightColor: meta.highlightColor || '#FFE600',
        fontSize: meta.fontSize ?? 22,
        verticalPosition: meta.verticalPosition ?? 78,
        wordPacing: meta.wordPacing || 'POP_TWO_WORDS',
        autoEmojis: meta.autoEmojis ?? true,
        uppercase: meta.uppercase ?? true,
        layoutMode: meta.layoutMode || 'FIT_BLUR',
        showShoppableDrawer: meta.showShoppableDrawer ?? true,
        showQrCode: meta.showQrCode ?? true,
        qrPlacement: meta.qrPlacement || 'TOP_RIGHT',
        qrCustomUrl: meta.qrCustomUrl,
        productId: meta.productId,
        productTitle: meta.productTitle,
        productPrice: meta.productPrice,
        thumbnailTitle: meta.thumbnailTitle || s.title,
        thumbnailStyle: meta.thumbnailStyle || 'VIRAL_WHITE',
        thumbnailFontSize: meta.thumbnailFontSize || 54,
        thumbnailPosition: meta.thumbnailPosition || 45,
        thumbnailBadge: s.thumbnailBadge || meta.thumbnailBadge || (s.status === 'READY' ? '⚡ READY' : '⚡ DRAFT'),
        thumbnailStrokeWidth: meta.thumbnailStrokeWidth || 14,
        thumbnailUppercase: meta.thumbnailUppercase ?? true,
        publishedYouTubeUrl: meta.publishedYouTubeUrl,
        publishedAt: s.updatedAt || s.createdAt,
        status: s.status === 'READY' ? 'PUBLISHED' : 'DRAFT',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      } as FormattedShortProject;
    });
  } catch (err) {
    console.warn('Failed to fetch cloud library shorts:', err);
    return [];
  }
}

export async function saveShortProject(
  short: FormattedShortProject,
  videoBlob?: Blob
): Promise<void> {
  try {
    // 0. Remove from deleted blacklist if user explicitly saves or updates it
    removeDeletedShortId(short.id);

    // 1. If video blob provided, store video in IndexedDB under short_video_<id>
    if (videoBlob) {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(
        {
          blob: videoBlob,
          name: short.videoFileName || `${short.title}.mp4`,
          type: videoBlob.type,
          size: videoBlob.size,
          updatedAt: Date.now(),
        },
        `short_video_${short.id}`
      );
    }

    // 2. Save metadata to localStorage library with canonical deduplication
    let list: FormattedShortProject[] = [];
    const raw = localStorage.getItem(SHORTS_LIBRARY_KEY);
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch (e) {
        list = [];
      }
    }

    const clientKey = short.clientShortId || short.id;
    const existingIdx = list.findIndex(
      (item) => item.id === short.id || item.clientShortId === clientKey || item.id === clientKey
    );

    if (existingIdx >= 0) {
      list[existingIdx] = { ...short, clientShortId: clientKey, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...short, clientShortId: clientKey, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(SHORTS_LIBRARY_KEY, JSON.stringify(list));

    // 3. Background sync draft to PostgreSQL cloud database (only for non-published drafts)
    if (short.status !== 'PUBLISHED') {
      saveShortDraftToCloud(short, videoBlob).catch((cloudErr) => {
        console.warn('Cloud draft background sync warning:', cloudErr);
      });
    }
  } catch (err) {
    console.warn('Failed to save short project:', err);
  }
}

export function getAllShortProjects(): FormattedShortProject[] {
  try {
    const deletedSet = getDeletedShortIds();
    let list: FormattedShortProject[] = [];
    const data = localStorage.getItem(SHORTS_LIBRARY_KEY);
    if (data) {
      try {
        list = JSON.parse(data);
      } catch (e) {
        list = [];
      }
    }

    // Deduplicate items by ID, clientShortId, and content signature (title + transcript)
    const seenIds = new Set<string>();
    const seenSignatures = new Set<string>();
    const deduplicated: FormattedShortProject[] = [];

    for (const item of list) {
      if (!item || !item.id) continue;
      if (seenIds.has(item.id)) continue;

      const normTitle = (item.title || '').trim().toLowerCase();
      const normTranscript = (item.editableTranscript || '').slice(0, 60).trim().toLowerCase();
      const signature = normTitle ? `${normTitle}|${normTranscript}` : item.id;

      if (seenSignatures.has(signature)) {
        continue;
      }

      seenIds.add(item.id);
      if (item.clientShortId) seenIds.add(item.clientShortId);
      if (signature) seenSignatures.add(signature);
      deduplicated.push(item);
    }

    // Persist cleaned deduplicated list
    if (deduplicated.length !== list.length) {
      localStorage.setItem(SHORTS_LIBRARY_KEY, JSON.stringify(deduplicated));
    }

    return deduplicated;
  } catch (err) {
    console.warn('Failed to get saved shorts:', err);
    return [];
  }
}

export async function getShortProject(id: string): Promise<{ project: FormattedShortProject; blob: Blob | null } | null> {
  try {
    const list = getAllShortProjects();
    const found = list.find((item) => item.id === id);
    if (!found) return null;

    let blob: Blob | null = null;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(`short_video_${id}`);
      blob = await new Promise<Blob | null>((resolve) => {
        req.onsuccess = () => {
          const res = req.result;
          resolve(res?.blob || null);
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {}

    // Fallback: If not found under short_video_<id>, check active_short_video
    if (!blob) {
      const draftVid = await getDraftVideoBlob();
      blob = draftVid?.blob || null;
    }

    return { project: found, blob };
  } catch (err) {
    console.warn('Failed to get short project:', err);
    return null;
  }
}

export async function deleteShortProject(id: string): Promise<void> {
  try {
    // 1. Add to deleted blacklist to prevent re-synthesis
    addDeletedShortId(id);

    // 2. Remove from raw localStorage library
    const raw = localStorage.getItem(SHORTS_LIBRARY_KEY);
    if (raw) {
      try {
        const list: FormattedShortProject[] = JSON.parse(raw);
        const filtered = list.filter((item) => item.id !== id);
        localStorage.setItem(SHORTS_LIBRARY_KEY, JSON.stringify(filtered));
      } catch (e) {}
    }

    // 3. If this deleted short matches the active working draft, clear active draft cache
    try {
      const draftJson = localStorage.getItem('digitpop_shorts_formatter_draft_v1');
      if (draftJson) {
        const draft = JSON.parse(draftJson);
        if (draft.id === id || id === 'short_active_draft') {
          localStorage.removeItem('digitpop_shorts_formatter_draft_v1');
          await clearDraftVideoBlob();
        }
      }
    } catch (e) {}

    // 4. Remove video blob from IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(`short_video_${id}`);
    } catch (e) {}

    // 5. Delete from cloud DB (best-effort — only fires if ID is a server UUID)
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      try {
        const apiBase = (
          (import.meta as any).env?.VITE_API_URL ||
          (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:9000'
            : 'https://digitpop.opportunity-system.com')
        ).replace(/\/+$/, '');
        await fetch(`${apiBase}/api/publisher/shorts/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Cloud delete best-effort failed:', e);
      }
    }
  } catch (err) {
    console.warn('Failed to delete short project:', err);
  }
}

const getApiBase = () =>
  (
    (import.meta as any).env?.VITE_API_URL ||
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:9000'
      : 'https://digitpop.opportunity-system.com')
  ).replace(/\/+$/, '');

/**
 * Toggle a short's published state in the cloud DB.
 * publish=true  → status READY (visible on About page)
 * publish=false → status DRAFT (hidden from About page)
 */
export async function setShortPublishedInCloud(
  id: string,
  publish: boolean,
): Promise<{ success: boolean; status?: string }> {
  try {
    const action = publish ? 'publish' : 'unpublish';
    const res = await fetch(`${getApiBase()}/api/publisher/shorts/${id}/${action}`, { method: 'PATCH' });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: data.success === true, status: data.status };
  } catch (err) {
    console.warn(`setShortPublishedInCloud(${id}, ${publish}) error:`, err);
    return { success: false };
  }
}

/**
 * Permanently delete a 16:9 VOD project from the cloud DB.
 */
export async function deleteVodProjectFromCloud(
  projectId: string,
): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${getApiBase()}/api/publisher/projects/${projectId}`, { method: 'DELETE' });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: data.success === true };
  } catch (err) {
    console.warn(`deleteVodProjectFromCloud(${projectId}) error:`, err);
    return { success: false };
  }
}

export async function loadShortProjectIntoActiveDraft(short: FormattedShortProject, blob?: Blob | null): Promise<void> {
  try {
    const draftData = {
      id: short.id,
      title: short.title,
      videoFileName: short.videoFileName,
      words: short.words,
      editableTranscript: short.editableTranscript,
      highlightColor: short.highlightColor,
      fontSize: short.fontSize,
      verticalPosition: short.verticalPosition,
      wordPacing: short.wordPacing,
      autoEmojis: short.autoEmojis,
      uppercase: short.uppercase,
      layoutMode: short.layoutMode,
      showShoppableDrawer: short.showShoppableDrawer,
      showQrCode: short.showQrCode,
      qrPlacement: short.qrPlacement,
      qrCustomUrl: short.qrCustomUrl,
      selectedProductId: short.productId || null,
      productTitle: short.productTitle,
      productPrice: short.productPrice,
      videoTitle: short.videoTitle || short.thumbnailTitle || short.title,
      videoDescription: short.videoDescription || '',
      pinnedCommentText: short.pinnedCommentText || '',
      thumbnailTitle: short.thumbnailTitle || short.title,
      thumbnailStyle: short.thumbnailStyle || 'VIRAL_WHITE',
      thumbnailFontSize: short.thumbnailFontSize || 54,
      thumbnailPosition: short.thumbnailPosition || 45,
      thumbnailBadge: short.thumbnailBadge || '⚡ MUST WATCH',
      thumbnailStrokeWidth: short.thumbnailStrokeWidth || 14,
      thumbnailUppercase: short.thumbnailUppercase ?? true,
      thumbnailImage: short.thumbnailUrl || null,
      publishedYouTubeUrl: short.publishedYouTubeUrl,
      publishedAt: short.publishedAt,
      status: short.status,
      createdAt: short.createdAt,
      updatedAt: Date.now(),
    };
    localStorage.setItem('digitpop_shorts_formatter_draft_v1', JSON.stringify(draftData));

    if (blob) {
      await saveDraftVideoBlob(blob, short.videoFileName || `${short.title}.mp4`);
    }
  } catch (err) {
    console.warn('Failed to load short project into draft:', err);
  }
}

