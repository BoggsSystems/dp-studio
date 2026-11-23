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
  anchorTopPercent: number;     // e.g. 14 for top bezel
  columnWidthPx: number;        // e.g. 330 for mobile viewport
  fontSizePx: number;           // e.g. 28
  lineHeight: number;           // e.g. 1.6
  theme: ColorTheme;
  showGuideLine: boolean;
  showVignette: boolean;
  textAlignment: TextAlignment;
  targetWpm: number;            // e.g. 140
  autoPauseOnCues: boolean;
}

export type TokenType = 'word' | 'cue' | 'heading' | 'break';

export interface ScriptToken {
  id: string;
  type: TokenType;
  content: string;
  cueType?: 'PAUSE' | 'SHOW_PRODUCT' | 'PIN_PRODUCT' | 'QUESTION' | 'CALL_TO_ACTION' | 'NOTE';
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
