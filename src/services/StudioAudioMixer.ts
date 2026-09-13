/**
 * StudioAudioMixer.ts
 *
 * Professional Web Audio API studio mixer engine for DigitPop Master Control.
 * Combines Broadcaster Microphone + Mac Mini Desktop System Audio into a unified
 * broadcast-ready 48kHz stereo stream with gain controls, mute toggles, and live VU meters.
 */

export interface AudioLevels {
  micLevel: number; // 0.0 to 1.0
  desktopLevel: number; // 0.0 to 1.0
  masterLevel: number; // 0.0 to 1.0
}

export class StudioAudioMixer {
  private audioCtx: AudioContext | null = null;

  // Nodes
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private isMicMuted: boolean = false;
  private micVolume: number = 1.0;

  private desktopSource: MediaStreamAudioSourceNode | null = null;
  private desktopGain: GainNode | null = null;
  private desktopAnalyser: AnalyserNode | null = null;
  private isDesktopMuted: boolean = false;
  private desktopVolume: number = 1.0;

  private monitorGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private masterDestination: MediaStreamAudioDestinationNode | null = null;

  private dataArray: Uint8Array = new Uint8Array(128);

  constructor() {
    // Lazy initialize AudioContext on user interaction
  }

  private initContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 48000 });

      // Master output bus
      this.masterGain = this.audioCtx.createGain();
      this.masterAnalyser = this.audioCtx.createAnalyser();
      this.masterAnalyser.fftSize = 256;
      this.masterAnalyser.smoothingTimeConstant = 0.5;

      this.masterDestination = this.audioCtx.createMediaStreamDestination();

      this.masterGain.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.masterDestination);

      // Local monitoring bus (allows broadcaster to hear desktop sound through headphones)
      this.monitorGain = this.audioCtx.createGain();
      this.monitorGain.gain.value = 1.0;
      this.monitorGain.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  /**
   * Attach Broadcaster Microphone Stream
   */
  public attachMicrophone(micStream: MediaStream): void {
    const ctx = this.initContext();

    if (this.micSource) {
      try { this.micSource.disconnect(); } catch (e) {}
    }

    this.micSource = ctx.createMediaStreamSource(micStream);
    this.micGain = ctx.createGain();
    this.micGain.gain.value = this.isMicMuted ? 0 : this.micVolume;

    this.micAnalyser = ctx.createAnalyser();
    this.micAnalyser.fftSize = 256;
    this.micAnalyser.smoothingTimeConstant = 0.4;

    this.micSource.connect(this.micGain);
    this.micGain.connect(this.micAnalyser);
    if (this.masterGain) {
      this.micAnalyser.connect(this.masterGain);
    }
  }

  /**
   * Attach Mac Desktop / System Sound Track
   */
  public attachDesktopAudio(audioTrack: MediaStreamTrack): void {
    const ctx = this.initContext();

    if (this.desktopSource) {
      try { this.desktopSource.disconnect(); } catch (e) {}
    }

    const desktopStream = new MediaStream([audioTrack]);
    this.desktopSource = ctx.createMediaStreamSource(desktopStream);
    this.desktopGain = ctx.createGain();
    this.desktopGain.gain.value = this.isDesktopMuted ? 0 : this.desktopVolume;

    this.desktopAnalyser = ctx.createAnalyser();
    this.desktopAnalyser.fftSize = 256;
    this.desktopAnalyser.smoothingTimeConstant = 0.4;

    this.desktopSource.connect(this.desktopGain);
    this.desktopGain.connect(this.desktopAnalyser);

    if (this.masterGain) {
      this.desktopAnalyser.connect(this.masterGain);
    }

    // Connect to headphone monitor so broadcaster hears desktop audio
    if (this.monitorGain) {
      this.desktopGain.connect(this.monitorGain);
    }
  }

  /**
   * Volume Controls
   */
  public setMicVolume(val: number): void {
    this.micVolume = Math.max(0, Math.min(1.5, val));
    if (this.micGain && !this.isMicMuted) {
      this.micGain.gain.setValueAtTime(this.micVolume, this.audioCtx?.currentTime || 0);
    }
  }

  public setDesktopVolume(val: number): void {
    this.desktopVolume = Math.max(0, Math.min(1.5, val));
    if (this.desktopGain && !this.isDesktopMuted) {
      this.desktopGain.gain.setValueAtTime(this.desktopVolume, this.audioCtx?.currentTime || 0);
    }
  }

  public toggleMicMute(): boolean {
    this.isMicMuted = !this.isMicMuted;
    if (this.micGain) {
      this.micGain.gain.setValueAtTime(this.isMicMuted ? 0 : this.micVolume, this.audioCtx?.currentTime || 0);
    }
    return this.isMicMuted;
  }

  public toggleDesktopMute(): boolean {
    this.isDesktopMuted = !this.isDesktopMuted;
    if (this.desktopGain) {
      this.desktopGain.gain.setValueAtTime(this.isDesktopMuted ? 0 : this.desktopVolume, this.audioCtx?.currentTime || 0);
    }
    return this.isDesktopMuted;
  }

  /**
   * Returns current Peak VU levels (0.0 to 1.0) for visual LED bars
   */
  public getLevels(): AudioLevels {
    const calculatePeak = (analyser: AnalyserNode | null, isMuted: boolean): number => {
      if (!analyser || isMuted) return 0;
      analyser.getByteFrequencyData(this.dataArray as any);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const avg = sum / this.dataArray.length;
      return Math.min(1.0, avg / 128);
    };

    return {
      micLevel: calculatePeak(this.micAnalyser, this.isMicMuted),
      desktopLevel: calculatePeak(this.desktopAnalyser, this.isDesktopMuted),
      masterLevel: calculatePeak(this.masterAnalyser, false)
    };
  }

  /**
   * Get the mixed broadcast-ready audio track
   */
  public getMixedAudioTrack(): MediaStreamTrack | null {
    if (!this.masterDestination) return null;
    const tracks = this.masterDestination.stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }

  /**
   * Cleanup
   */
  public close(): void {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

export const studioMixer = new StudioAudioMixer();
