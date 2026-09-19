// Data Models aligned with Prisma PostgreSQL Schema (v3)

export type ViewingMode = 'SIDE_PANEL' | 'TAP_TO_REVEAL' | 'PAUSE_INSPECT';

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  role: 'ADMIN' | 'PUBLISHER' | 'VIEWER';
  earnedCredits?: number;
  createdAt?: string;
}

export interface ProductVariant {
  id?: string;
  name: string; // e.g. "Size", "Color"
  value: string; // e.g. "Medium", "Obsidian Black"
  priceAdjustment?: number; // e.g. +5.00
}

export type CheckoutType = 'NATIVE_STRIPE' | 'AMAZON' | 'SHOPIFY' | 'EXTERNAL_LINK';

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  imageUrls?: string[];
  stripePriceId?: string;
  externalUrl?: string;
  description?: string;
  variants?: ProductVariant[];
  source?: 'CUSTOM' | 'SHOPIFY' | 'AMAZON' | 'STRIPE';
  vendor?: string;
  inventoryCount?: number;
  handle?: string;
  shopifyId?: string;
  checkoutType?: CheckoutType;
  buttonTextOverride?: string;
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
  category?: string;
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

export interface StreamSession {
  id: string;
  title: string;
  streamKey: string;
  whipIngestUrl?: string;
  hlsPlaybackUrl?: string;
  status: 'CREATED' | 'LIVE' | 'ENDED' | 'ERROR';
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  productGroups?: ProductGroup[];
  createdAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  projectId?: string;
  projectName?: string;
  category: string;
  budgetAmount: number;
  dailyBudgetLimit?: number;
  startDate: string;
  endDate: string;
  biddingModel: 'CPM' | 'CPC' | 'COMPREHENSION';
  verificationQuestion: string;
  verificationOptions: string[];
  correctOptionIndex: number;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  impressions?: number;
  clicks?: number;
  brandRecallRate?: number;
  totalSpent?: number;
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

export interface FormattedShortProject {
  id: string;
  title: string;
  videoUrl?: string;
  videoFileName?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  words: { id: string; word: string; start: number; end: number }[];
  editableTranscript: string;
  highlightColor: string;
  fontSize: number;
  verticalPosition: number;
  wordPacing: string;
  autoEmojis: boolean;
  uppercase: boolean;
  layoutMode: 'FIT_BLUR' | 'COVER_CROP';
  showShoppableDrawer: boolean;
  showQrCode: boolean;
  qrPlacement: string;
  qrCustomUrl: string;
  productId?: string;
  productTitle?: string;
  productPrice?: number;
  videoTitle?: string;
  videoDescription?: string;
  pinnedCommentText?: string;
  thumbnailTitle?: string;
  thumbnailStyle?: string;
  thumbnailFontSize?: number;
  thumbnailPosition?: number;
  thumbnailBadge?: string;
  thumbnailStrokeWidth?: number;
  thumbnailUppercase?: boolean;
  publishedYouTubeUrl?: string;
  publishedAt?: string;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
}

