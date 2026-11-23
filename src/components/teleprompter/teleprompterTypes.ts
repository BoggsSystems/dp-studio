export type AnchorPosition = 'top' | 'bottom';
export type ColorTheme = 'oled-black' | 'charcoal' | 'high-vis-yellow' | 'warm-amber';
export type TextAlignment = 'center' | 'left';

export type PrompterState = 
  | 'EDITING' 
  | 'READY' 
  | 'SCROLLING' 
  | 'PAUSED' 
  | 'MANUAL_OVERRIDE' 
  | 'CUE_PAUSED' 
  | 'COMPLETED';

export interface OpticalConfig {
  anchorPosition: AnchorPosition;
  anchorTopPercent: number;     // e.g. 14 for top bezel, 80 for bottom bezel
  columnWidthPx: number;        // e.g. 480
  fontSizePx: number;           // e.g. 34
  lineHeight: number;           // e.g. 1.7
  theme: ColorTheme;
  showGuideLine: boolean;
  showVignette: boolean;
  textAlignment: TextAlignment;
  targetWpm: number;            // e.g. 140
  autoPauseOnCues: boolean;     // Whether [PAUSE] cues halt the scroller or act as visual guides
}

export type TokenType = 'word' | 'cue' | 'heading' | 'break';

export interface ScriptToken {
  id: string;
  type: TokenType;
  content: string;
  cueType?: 'PAUSE' | 'SHOW_PRODUCT' | 'PIN_PRODUCT' | 'CALL_TO_ACTION' | 'SLIDE' | 'QUESTION' | 'EMPHASIZE' | 'NOTE';
  cueDurationSec?: number;
  cueLabel?: string;
  productId?: string;
  wordIndex?: number;
  sectionIndex?: number;
}

export interface SectionHeader {
  id: string;
  title: string;
  tokenIndex: number;
  wordIndex: number;
}

export interface PacingMetrics {
  totalWords: number;
  currentWordIndex: number;
  elapsedSeconds: number;
  estimatedTotalSeconds: number;
  currentWpm: number;
  targetWpm: number;
  progressPercent: number;
}
