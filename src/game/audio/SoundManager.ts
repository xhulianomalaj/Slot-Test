import { sound } from "@pixi/sound";

/**
 * Manages all game audio including sound effects and music
 */
export class SoundManager {
  private static _instance: SoundManager;
  private _soundsLoaded: boolean = false;
  private _isMuted: boolean = false;
  private _soundEffectsMuted: boolean = false;
  private _volume: number = 1.0;

  // Sound effect instances
  private _winSound: string = "win-sound";
  private _backgroundMusic: string = "background-music";
  private _spinningSound: string = "spinning-sound";
  private _backgroundMusicInstance: any = null;
  private _spinningInstances: any[] = [];

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of SoundManager
   */
  public static getInstance(): SoundManager {
    if (!SoundManager._instance) {
      SoundManager._instance = new SoundManager();
    }
    return SoundManager._instance;
  }

  /**
   * Initialize and load all game sounds
   */
  public async initialize(): Promise<void> {
    if (this._soundsLoaded) {
      return;
    }

    try {
      // Load the win sound effect
      await sound.add(this._winSound, "assets/sounds/effects/win.mp3");

      // Load the spinning sound effect
      await sound.add(
        this._spinningSound,
        "assets/sounds/effects/spinning.wav"
      );

      // Load the background music
      await sound.add(
        this._backgroundMusic,
        "assets/sounds/music/backgroundMusic.mp3"
      );

      this._soundsLoaded = true;

      // Start background music after loading
      this.startBackgroundMusic();
    } catch (error) {
      console.error("SoundManager: Failed to load sounds:", error);
      throw error;
    }
  }

  /**
   * Play the win sound effect
   */
  public playWinSound(): void {
    if (!this._soundsLoaded || this._soundEffectsMuted) {
      return;
    }

    try {
      sound.play(this._winSound, {
        volume: this._volume * 0.2,
      });
    } catch (error) {
      console.error("SoundManager: Failed to play win sound:", error);
    }
  }

  /**
   * Start playing background music in a loop
   */
  public startBackgroundMusic(): void {
    if (!this._soundsLoaded || this._isMuted) {
      return;
    }

    try {
      // Stop any existing background music first
      this.stopBackgroundMusic();

      // Start playing background music in a loop
      this._backgroundMusicInstance = sound.play(this._backgroundMusic, {
        volume: this._volume * 2, // Background music should be quieter
        loop: true,
      });
    } catch (error) {
      console.error("SoundManager: Failed to start background music:", error);
    }
  }

  /**
   * Stop background music
   */
  public stopBackgroundMusic(): void {
    if (this._backgroundMusicInstance) {
      try {
        // Use the sound library to stop by alias name
        sound.stop(this._backgroundMusic);
        this._backgroundMusicInstance = null;
      } catch (error) {
        console.error("SoundManager: Failed to stop background music:", error);
      }
    }
  }

  /**
   * Start spinning sound for all reels (both instant and normal play modes)
   */
  public startSpinningSound(): any {
    if (!this._soundsLoaded || this._soundEffectsMuted) {
      return null;
    }

    try {
      // First stop any existing spinning sounds to avoid overlap
      this.stopAllSpinningSounds();

      const spinningInstance = sound.play(this._spinningSound, {
        volume: this._volume * 0.2, // Spinning sound at moderate volume
        loop: true,
      });

      if (spinningInstance) {
        this._spinningInstances.push(spinningInstance);
      }
      return spinningInstance;
    } catch (error) {
      console.error("SoundManager: Failed to start spinning sound:", error);
      return null;
    }
  }

  /**
   * Stop spinning sounds - simplified approach using sound name
   */
  public stopSpinningSound(): void {
    try {
      // Stop all instances of the spinning sound by name (most reliable method)
      sound.stop(this._spinningSound);

      // Clear our tracking array
      this._spinningInstances = [];
    } catch (error) {
      console.error("SoundManager: Failed to stop spinning sound:", error);
    }
  }

  /**
   * Stop all spinning sounds
   */
  public stopAllSpinningSounds(): void {
    try {
      // Stop all instances of the spinning sound by name (most reliable method)
      sound.stop(this._spinningSound);

      // Clear our tracking array
      this._spinningInstances = [];
    } catch (error) {
      console.error("SoundManager: Failed to stop all spinning sounds:", error);
    }
  }

  /**
   * Set the master volume for all sounds
   * @param volume Volume level between 0.0 and 1.0
   */
  public setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));

    // Update the global volume for all sounds
    sound.volumeAll = this._volume;

    // Restart background music with new volume if it's currently playing
    if (this._backgroundMusicInstance) {
      try {
        // Stop current instance and restart with new volume
        sound.stop(this._backgroundMusic);
        this._backgroundMusicInstance = sound.play(this._backgroundMusic, {
          volume: this._volume * 2,
          loop: true,
        });
      } catch (error) {
        console.error(
          "SoundManager: Failed to update background music volume:",
          error
        );
      }
    }
  }

  /**
   * Get the current volume level
   */
  public getVolume(): number {
    return this._volume;
  }

  /**
   * Mute or unmute all sounds
   */
  public setMuted(muted: boolean): void {
    this._isMuted = muted;

    if (muted) {
      sound.muteAll();
    } else {
      sound.unmuteAll();
      // Restart background music if it was playing
      if (this._soundsLoaded && !this._backgroundMusicInstance) {
        this.startBackgroundMusic();
      }
    }
  }

  /**
   * Check if sounds are currently muted
   */
  public isMuted(): boolean {
    return this._isMuted;
  }

  /**
   * Mute or unmute sound effects only (win sounds, spinning sounds)
   */
  public setSoundEffectsMuted(muted: boolean): void {
    this._soundEffectsMuted = muted;
  }

  /**
   * Check if sound effects are currently muted
   */
  public isSoundEffectsMuted(): boolean {
    return this._soundEffectsMuted;
  }

  /**
   * Stop all currently playing sounds
   */
  public stopAll(): void {
    this.stopAllSpinningSounds();
    sound.stopAll();
    this._backgroundMusicInstance = null;
  }

  /**
   * Check if sounds are loaded and ready
   */
  public isReady(): boolean {
    return this._soundsLoaded;
  }

  /**
   * Cleanup and destroy all sound resources
   */
  public destroy(): void {
    this.stopBackgroundMusic();
    this.stopAllSpinningSounds();
    sound.removeAll();
    this._soundsLoaded = false;
  }
}
