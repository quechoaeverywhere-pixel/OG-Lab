/**
 * Audio Synthesizer for OG Lab
 * Generates warm, calming, elegant sounds using Web Audio API
 * No external mp3 files required. Safe for all browsers.
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private radarInterval: any = null;

  constructor() {
    // Check user preference if saved
    try {
      const pref = localStorage.getItem('og_sound_enabled');
      if (pref !== null) {
        this.soundEnabled = pref === 'true';
      }
    } catch {}
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopWaitingRadar();
    }
    try {
      localStorage.setItem('og_sound_enabled', enabled ? 'true' : 'false');
    } catch {}
  }

  /**
   * Subtle, soft futuristic activation sound when any AI Action button is clicked
   */
  public playAITrigger() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.debug('AI trigger audio failed silently:', e);
    }
  }

  /**
   * Single soft radar pulse "tút" - warm, soothing, non-intrusive sine tone
   */
  private playSingleRadarPulse() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Soft warm low-pass filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      osc.type = 'sine';
      // Soothing harmonic frequency (~523Hz C5)
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.08); // Slight upward swell

      // Soft envelope: attack 0.03s, gentle ringing decay 0.45s
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.48);
    } catch (e) {
      console.debug('Radar pulse failed silently:', e);
    }
  }

  /**
   * Starts a slow, soothing periodic waiting radar tone ("tút... tút... tút...")
   * Interval defaults to 1.3 seconds for a calm, relaxing meditation pace.
   */
  public startWaitingRadar(intervalMs: number = 1300) {
    this.stopWaitingRadar();
    if (!this.soundEnabled) return;

    // Play first pulse immediately
    this.playSingleRadarPulse();

    this.radarInterval = setInterval(() => {
      this.playSingleRadarPulse();
    }, intervalMs);
  }

  /**
   * Stops the ongoing waiting radar tone
   */
  public stopWaitingRadar() {
    if (this.radarInterval) {
      clearInterval(this.radarInterval);
      this.radarInterval = null;
    }
  }

  /**
   * Crisp, bright, soothing melodic chime when a single chapter finishes
   * Melodic interval (G5 -> C6 -> E6) with clear ringing decay
   */
  public playChapterChime() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [783.99, 1046.50, 1318.51]; // G5, C6, E6
      
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.09);

        gain.gain.setValueAtTime(0.0001, now + index * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.09, now + index * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + index * 0.09 + 1.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.09);
        osc.stop(now + index * 0.09 + 1.1);
      });
    } catch (e) {
      console.debug('Audio chapter chime failed silently:', e);
    }
  }

  /**
   * Calm, soft chime when a chapter/dossier is successfully written
   * Harmonic triad chord (C5 - E5 - G5 - C6) with soft decay
   */
  public playCompletionChime() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Elegant pentatonic chord frequencies
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        // Soft envelope: attack 0.02s, decay 1.2s
        gain.gain.setValueAtTime(0.0001, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.08 / (index + 1), now + index * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + index * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 1.3);
      });
    } catch (e) {
      console.debug('Audio play failed silently:', e);
    }
  }

  /**
   * Celebratory multi-harmonic chime when an entire Pillar (all chapters) finishes
   */
  public playGrandCompletionChime() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const frequencies = [440.0, 554.37, 659.25, 880.0, 1108.73, 1318.51]; // A4, C#5, E5, A5, C#6, E6
      
      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.07);

        gain.gain.setValueAtTime(0.0001, now + index * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.08, now + index * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + index * 0.07 + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.07);
        osc.stop(now + index * 0.07 + 1.7);
      });
    } catch (e) {
      console.debug('Audio grand chime failed silently:', e);
    }
  }

  /**
   * Gentle reminder chime when high demand or queueing occurs
   * Warm single bell chime
   */
  public playGentleNotice() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3); // A5

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.0);
    } catch (e) {
      console.debug('Audio notice failed silently:', e);
    }
  }
}

export const audioFx = new SoundEffects();
