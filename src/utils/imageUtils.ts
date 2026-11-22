/**
 * Image Utilities for ShopVideo Studio
 * Provides robust resolution, CDN routing, Amazon proxying, and fallback placeholders.
 */

export const R2_PUBLIC_DOMAIN = 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev';
export const API_BASE_URL = 'https://api.shopvideo.tv';

// Sleek dark-mode SVG placeholder with cyan accent bag and ShopVideo.tv branding
export const PRODUCT_PLACEHOLDER_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none">
  <rect width="400" height="400" fill="#0B132B"/>
  <rect x="16" y="16" width="368" height="368" rx="12" fill="#141E33" stroke="#25324B" stroke-width="2"/>
  <g transform="translate(160, 136)" stroke="#00E5FF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </g>
  <text x="200" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#8E9EB5" text-anchor="middle">Product Media Preview</text>
  <text x="200" y="255" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#475569" text-anchor="middle">ShopVideo.tv</text>
</svg>
`.trim());

/**
 * Resolves any image URL to an accessible, CORS-safe, displayable URL.
 * Handles:
 * 1. Base64 data URIs and object blobs (direct return)
 * 2. Amazon images (proxied via https://api.shopvideo.tv/api/images/proxy?url=...)
 * 3. Relative proxy paths (/api/images/proxy) -> prefixed with API_BASE_URL
 * 4. Local uploads/assets (/images/, /thumbnails/) -> mapped to R2 media bucket
 */
export function resolveProductImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return PRODUCT_PLACEHOLDER_IMAGE;
  }

  const clean = url.trim();

  // Local previews from FileReader or object URLs
  if (clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  // Already a proxy URL
  if (clean.includes('/api/images/proxy?url=')) {
    if (clean.startsWith('/')) {
      return `${API_BASE_URL}${clean}`;
    }
    return clean;
  }

  // Amazon hotlink protection bypass - route through API proxy with Amazon Referer
  if (
    clean.includes('amazon.com') ||
    clean.includes('media-amazon.com') ||
    clean.includes('ssl-images-amazon.com')
  ) {
    return `${API_BASE_URL}/api/images/proxy?url=${encodeURIComponent(clean)}`;
  }

  // R2 assets or public directory references
  if (clean.startsWith('/images/') || clean.startsWith('/thumbnails/')) {
    const filename = clean.split('/').pop();
    return `${R2_PUBLIC_DOMAIN}/products/${filename}`;
  }

  return clean;
}

/**
 * Reusable onError handler for <img> elements to gracefully fallback
 * to the sleek branded placeholder without rendering browser broken glyphs.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== PRODUCT_PLACEHOLDER_IMAGE) {
    target.src = PRODUCT_PLACEHOLDER_IMAGE;
  }
}
