// Data Models aligned with Prisma PostgreSQL Schema (v3)

export type ViewingMode = 'SIDE_PANEL' | 'TAP_TO_REVEAL' | 'PAUSE_INSPECT';

export interface ProductVariant {
  id?: string;
  name: string; // e.g. "Size", "Color"
  value: string; // e.g. "Medium", "Obsidian Black"
  priceAdjustment?: number; // e.g. +5.00
}

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  stripePriceId?: string;
  externalUrl?: string;
  description?: string;
  variants?: ProductVariant[];
}

export interface ProductGroup {
  id: string;
  projectId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  timestampSeconds: number;
  makeThisYourLookUrl?: string;
  viewingMode: ViewingMode;
  products: Product[];
  thumbnailUrl?: string;
}

export interface ProductBasketItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  isSelected: boolean;
}

export interface ProductBasket {
  id: string;
  projectId: string;
  title: string;
  subtitle?: string;
  discountPercentage: number;
  items: ProductBasketItem[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  masterVodUrl?: string;
  hlsManifestUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  isActive: boolean;
  productGroups: ProductGroup[];
  baskets?: ProductBasket[];
  createdAt?: string;
}

export interface Clip {
  id: string;
  projectId?: string;
  streamSessionId?: string;
  productId?: string;
  hookTitle: string;
  startSeconds: number;
  endSeconds: number;
  viralityScore: number;
  aspectRatio: 'VERTICAL_9_16' | 'WIDESCREEN_16_9' | 'SQUARE_1_1';
  resolution: string;
  renderedVideoUrl: string;
  subtitleAssUrl?: string;
  hashtags: string[];
  transcriptSegment: string;
  distributionLogs?: {
    platform: 'YOUTUBE_SHORTS' | 'TIKTOK' | 'INSTAGRAM_REELS' | 'X_TWITTER';
    status: 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
    postUrl?: string;
    publishedAt?: string;
  }[];
}

export interface QuizQuestion {
  id: string;
  productId?: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  bonusTokens: number;
  cpcSponsorFee: number;
  explanation?: string;
}

export interface AiTagDetection {
  id: string;
  title: string;
  timestampSeconds: number;
  confidence: number;
  suggestedPrice: number;
  category: string;
  visualBox?: { x: number; y: number; width: number; height: number };
}
