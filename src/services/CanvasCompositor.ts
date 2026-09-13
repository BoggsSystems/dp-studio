/**
 * CanvasCompositor.ts
 *
 * Hardware-accelerated 1080p 60fps HTML5 Canvas Compositing Engine.
 * Blits Screen Capture, Presenter Cam, Picture-in-Picture layouts,
 * and live shoppable interactive product cards/overlays directly into a unified MediaStream.
 */

import { studioMixer } from './StudioAudioMixer';

export type LayoutMode = 'FULLSCREEN_SCREEN' | 'FULLSCREEN_FACE' | 'PIP_CORNER' | 'SPLIT_SCREEN';
export type PipCorner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface ActiveOverlayProduct {
  id: string;
  title: string;
  subtitle?: string;
  price: string;
  icon?: string;
  badge?: string;
  activatedAt: number;
}

export class CanvasCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private screenVideo: HTMLVideoElement | null = null;
  private cameraVideo: HTMLVideoElement | null = null;

  private layoutMode: LayoutMode = 'PIP_CORNER';
  private pipCorner: PipCorner = 'bottom-right';
  private pipSize: 'small' | 'medium' | 'large' = 'medium';

  private activeOverlay: ActiveOverlayProduct | null = null;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;

  private outputStream: MediaStream | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1920;
    this.canvas.height = 1080;
    const context = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!context) throw new Error('Could not obtain 2D rendering context for CanvasCompositor');
    this.ctx = context;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public setScreenSource(videoEl: HTMLVideoElement | null): void {
    this.screenVideo = videoEl;
  }

  public setCameraSource(videoEl: HTMLVideoElement | null): void {
    this.cameraVideo = videoEl;
  }

  public setLayoutMode(mode: LayoutMode): void {
    this.layoutMode = mode;
  }

  public setPipCorner(corner: PipCorner): void {
    this.pipCorner = corner;
  }

  public setPipSize(size: 'small' | 'medium' | 'large'): void {
    this.pipSize = size;
  }

  public triggerOverlay(product: ActiveOverlayProduct): void {
    this.activeOverlay = product;
    // Auto-dismiss product overlay after 12 seconds
    setTimeout(() => {
      if (this.activeOverlay?.id === product.id) {
        this.activeOverlay = null;
      }
    }, 12000);
  }

  public clearOverlay(): void {
    this.activeOverlay = null;
  }

  /**
   * Starts the 60 FPS Canvas Render Loop
   */
  public start(): MediaStream {
    if (this.isRunning && this.outputStream) {
      return this.outputStream;
    }

    this.isRunning = true;

    const render = () => {
      if (!this.isRunning) return;
      this.drawFrame();
      this.animFrameId = requestAnimationFrame(render);
    };

    this.animFrameId = requestAnimationFrame(render);

    // Extract 60 FPS hardware video stream
    const canvasStream = this.canvas.captureStream(60);
    const mixedAudioTrack = studioMixer.getMixedAudioTrack();

    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    if (mixedAudioTrack) {
      tracks.push(mixedAudioTrack);
    }

    this.outputStream = new MediaStream(tracks);
    return this.outputStream;
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * Main 60 FPS Render Blitter
   */
  private drawFrame(): void {
    const { ctx, canvas } = this;
    const w = canvas.width; // 1920
    const h = canvas.height; // 1080

    // 1. Clear background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw base video layer
    if (this.layoutMode === 'FULLSCREEN_SCREEN' && this.screenVideo && this.screenVideo.readyState >= 2) {
      ctx.drawImage(this.screenVideo, 0, 0, w, h);
    } else if (this.layoutMode === 'FULLSCREEN_FACE' && this.cameraVideo && this.cameraVideo.readyState >= 2) {
      ctx.drawImage(this.cameraVideo, 0, 0, w, h);
    } else if (this.layoutMode === 'SPLIT_SCREEN') {
      const halfW = w / 2;
      if (this.screenVideo && this.screenVideo.readyState >= 2) {
        ctx.drawImage(this.screenVideo, 0, 0, halfW, h);
      }
      if (this.cameraVideo && this.cameraVideo.readyState >= 2) {
        ctx.drawImage(this.cameraVideo, halfW, 0, halfW, h);
      }
      // Divider line
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, h);
      ctx.stroke();
    } else {
      // Default: PIP_CORNER
      // Draw screen in background
      if (this.screenVideo && this.screenVideo.readyState >= 2) {
        ctx.drawImage(this.screenVideo, 0, 0, w, h);
      } else {
        this.drawStandbyBackground(w, h);
      }

      // Draw PiP Inset
      this.drawPipInset(w, h);
    }

    // 3. Draw Broadcast Watermark & HUD
    this.drawBroadcastHud(w, h);

    // 4. Draw Interactive Shoppable Overlay Card
    if (this.activeOverlay) {
      this.drawShoppableOverlayCard(w, h, this.activeOverlay);
    }
  }

  private drawStandbyBackground(w: number, h: number): void {
    const { ctx } = this;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#64748b';
    ctx.font = '700 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DIGITPOP MASTER CONTROL • WAITING FOR DISPLAY CAPTURE', w / 2, h / 2);
  }

  private drawPipInset(w: number, h: number): void {
    if (!this.cameraVideo || this.cameraVideo.readyState < 2) return;

    const { ctx } = this;
    let pipW = 420;
    let pipH = 260;
    if (this.pipSize === 'small') { pipW = 320; pipH = 200; }
    if (this.pipSize === 'large') { pipW = 540; pipH = 340; }

    const margin = 32;
    let x = w - pipW - margin;
    let y = h - pipH - margin;

    if (this.pipCorner === 'top-left') { x = margin; y = margin; }
    if (this.pipCorner === 'top-right') { x = w - pipW - margin; y = margin; }
    if (this.pipCorner === 'bottom-left') { x = margin; y = h - pipH - margin; }

    ctx.save();
    // Rounded rectangle clip path
    const radius = 16;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + pipW, y, x + pipW, y + pipH, radius);
    ctx.arcTo(x + pipW, y + pipH, x, y + pipH, radius);
    ctx.arcTo(x, y + pipH, x, y, radius);
    ctx.arcTo(x, y, x + pipW, y, radius);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(this.cameraVideo, x, y, pipW, pipH);
    ctx.restore();

    // Border and Glow
    ctx.save();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + pipW, y, x + pipW, y + pipH, radius);
    ctx.arcTo(x + pipW, y + pipH, x, y + pipH, radius);
    ctx.arcTo(x, y + pipH, x, y, radius);
    ctx.arcTo(x, y, x + pipW, y, radius);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  private drawBroadcastHud(w: number, h: number): void {
    const { ctx } = this;
    ctx.save();

    // Live Badge (Top-Left)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.roundRect(ctx, 32, 32, 160, 44, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Red dot
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(54, 54, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '800 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('LIVE 1080p', 72, 60);

    // Studio watermark (Top-Right)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    this.roundRect(ctx, w - 240, 32, 208, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 15px sans-serif';
    ctx.fillText('⚡ DIGITPOP STUDIO', w - 222, 60);

    ctx.restore();
  }

  private drawShoppableOverlayCard(w: number, h: number, product: ActiveOverlayProduct): void {
    const { ctx } = this;
    ctx.save();

    const cardW = 540;
    const cardH = 150;
    const cardX = 32;
    const cardY = h - cardH - 32;

    // Glassmorphic Backdrop
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();

    // Emerald Border
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Badge
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    this.roundRect(ctx, cardX + 20, cardY + 16, 170, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.font = '800 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ SHOPPABLE DROP', cardX + 30, cardY + 32);

    // Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 20px sans-serif';
    ctx.fillText(product.title, cardX + 20, cardY + 68);

    // Subtitle
    if (product.subtitle) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 13px sans-serif';
      ctx.fillText(product.subtitle.slice(0, 48), cardX + 20, cardY + 92);
    }

    // Price tag
    ctx.fillStyle = '#34d399';
    ctx.font = '800 26px monospace';
    ctx.fillText(product.price, cardX + 20, cardY + 130);

    // 1-Click Scan CTA
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    this.roundRect(ctx, cardX + cardW - 170, cardY + 95, 150, 38, 8);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📱 Instant Checkout', cardX + cardW - 95, cardY + 119);

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

export const canvasCompositor = new CanvasCompositor();
