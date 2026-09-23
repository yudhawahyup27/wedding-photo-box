/** Canonical booth mode IDs. Legacy `photo` and `strip` remain supported. */
export type PhotoMode = 'photo' | 'strip' | 'gif' | 'boomerang' | 'video' | 'classic' | 'magazine' | 'newspaper' | 'photobook';
export type CaptureType = 'photo' | 'video';

export interface MediaItem {
  type: 'image' | 'video';
  path: string;
  duration?: number;
  thumbnail?: string;
  width?: number;
  height?: number;
}

export interface TemplateText {
  headline: string;
  subheadline: string;
  name: string;
  date: string;
  quote: string;
  article?: string;
  venue?: string;
  issueNumber?: string;
  eventType?: string;
  eventName?: string;
  host?: string;
  location?: string;
  tagline?: string;
  caption?: string;
  edition?: string;
}

export type FrameCategory =
  | 'signature'
  | 'minimal'
  | 'floral'
  | 'editorial'
  | 'newspaper'
  | 'magazine'
  | 'wedding'
  | 'birthday'
  | 'corporate'
  | 'retro'
  | 'polaroid'
  | 'strip'
  | 'classic'
  | 'group'
  | 'fun'
  | 'dark';

export type FrameOrientation = 'portrait' | 'landscape' | 'square' | 'story' | 'strip';

export interface PhotoSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Corner radius in canvas px. */
  radius?: number;
  /** Rotation in degrees, for playful/polaroid-style tilted slots. */
  rotate?: number;
}

export interface FrameText {
  value: string;
  x: number;
  y: number;
  /** Font size in canvas px at the frame's native canvasWidth. */
  size: number;
  align: 'left' | 'center' | 'right';
  color: string;
  /** Logical role picks a font from the frame renderer's font map. */
  role: 'display' | 'script' | 'label' | 'mono';
  letterSpacing?: number;
  maxWidth?: number;
  lineHeight?: number;
  /** Dynamic tokens resolved at render time: {{couple}} {{monogram}} {{date}} {{hashtag}} */
}

export type DecorationKind =
  | 'floral-corner'
  | 'floral-border'
  | 'monogram-badge'
  | 'thin-rule'
  | 'double-rule'
  | 'polaroid-tab'
  | 'film-sprockets'
  | 'newspaper-rule'
  | 'gold-corner'
  | 'dark-vignette'
  | 'halftone-dots'
  | 'speech-bubble'
  | 'magazine-masthead'
  | 'newspaper-columns'
  | 'barcode'
  | 'comic-burst'
  | 'filler-lines'
  | 'newspaper-masthead-box'
  | 'body-copy'
  | 'paper-grain'
  | 'qr-code'
  | 'magazine-cover-lines'
  | 'daily-moment-broadsheet';

export interface FrameDecoration {
  kind: DecorationKind;
  /** Which corners/edges this decoration applies to, when relevant. */
  placement?: Array<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' | 'all'>;
  color?: string;
  /** Optional short text used by speech-bubble / comic-burst / magazine-masthead / newspaper-masthead-box. */
  text?: string;
  /** Optional secondary text (e.g. tagline under a masthead title). */
  subtext?: string;
  /** 'back' (default) draws under the photo slots; 'front' draws on top, for caption-style elements like a speech bubble or a magazine cover line. */
  layer?: 'back' | 'front';
  /** Free-positioned box, used by filler-lines to simulate paragraph text blocks. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  lines?: number;
  /** Real wrapped paragraph copy for 'body-copy' (supports {{couple}}/{{date}}/{{monogram}}/{{hashtag}} tokens). */
  fontSize?: number;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
}

export interface FrameConfig {
  id: string;
  name: string;
  slug: string;
  category: FrameCategory;
  description: string;
  orientation: FrameOrientation;
  photoCount: number;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  /** Optional secondary color used by decorations/text accents. */
  accentColor: string;
  photoSlots: PhotoSlot[];
  texts: FrameText[];
  decorations: FrameDecoration[];
  enabled: boolean;
  sortOrder: number;
}
