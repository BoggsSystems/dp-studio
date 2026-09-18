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

export async function saveShortProject(
  short: FormattedShortProject,
  videoBlob?: Blob
): Promise<void> {
  try {
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

    // 2. Save metadata to localStorage library
    const list = getAllShortProjects();
    const existingIdx = list.findIndex((item) => item.id === short.id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...short, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...short, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(SHORTS_LIBRARY_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save short project:', err);
  }
}

export function getAllShortProjects(): FormattedShortProject[] {
  try {
    const data = localStorage.getItem(SHORTS_LIBRARY_KEY);
    if (!data) return [];
    return JSON.parse(data);
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
    // 1. Remove from localStorage library
    const list = getAllShortProjects().filter((item) => item.id !== id);
    localStorage.setItem(SHORTS_LIBRARY_KEY, JSON.stringify(list));

    // 2. Remove video blob from IndexedDB
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(`short_video_${id}`);
  } catch (err) {
    console.warn('Failed to delete short project:', err);
  }
}

export async function loadShortProjectIntoActiveDraft(short: FormattedShortProject, blob?: Blob | null): Promise<void> {
  try {
    const draftData = {
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
      thumbnailTitle: short.thumbnailTitle || short.title,
      thumbnailStyle: short.thumbnailStyle || 'VIRAL_WHITE',
      thumbnailFontSize: short.thumbnailFontSize || 54,
      thumbnailPosition: short.thumbnailPosition || 45,
      thumbnailBadge: short.thumbnailBadge || '⚡ MUST WATCH',
      thumbnailStrokeWidth: short.thumbnailStrokeWidth || 14,
      thumbnailUppercase: short.thumbnailUppercase ?? true,
      thumbnailImage: short.thumbnailUrl || null,
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

