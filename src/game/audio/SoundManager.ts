import { sound } from "@pixi/sound";

export class SoundManager {
  private static _instance: SoundManager;
  private _soundsLoaded: boolean = false;
  private _isMuted: boolean = false;
  private _soundEffectsMuted: boolean = false;
  private _volume: number = 1.0;

  private _winSound: string = "win-sound";
  private _backgroundMusic: string = "background-music";
  private _spinningSound: string = "spinning-sound";
  private _buttonPressSound: string = "button-press-sound";
  private _backgroundMusicInstance: any = null;
  private _spinningInstances: any[] = [];

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager._instance) {
      SoundManager._instance = new SoundManager();
    }
    return SoundManager._instance;
  }

  public async initialize(): Promise<void> {
    if (this._soundsLoaded) {
      return;
    }

    try {
      await sound.add(this._winSound, "assets/sounds/effects/win.mp3");
      await sound.add(
        this._spinningSound,
        "assets/sounds/effects/spinning.wav"
      );
      await sound.add(
        this._buttonPressSound,
        "assets/sounds/effects/button-press.mp3"
      );
      await sound.add(
        this._backgroundMusic,
        "assets/sounds/music/backgroundMusic.mp3"
      );

      this._soundsLoaded = true;
      this.startBackgroundMusic();
    } catch (error) {
      console.error("SoundManager: Failed to load sounds:", error);
      throw error;
    }
  }

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

  public playButtonPressSound(): void {
    if (!this._soundsLoaded || this._soundEffectsMuted) {
      return;
    }

    try {
      sound.play(this._buttonPressSound, {
        volume: this._volume * 1,
      });
    } catch (error) {
      console.error("SoundManager: Failed to play button press sound:", error);
    }
  }

  public startBackgroundMusic(): void {
    if (!this._soundsLoaded || this._isMuted) {
      return;
    }

    try {
      this.stopBackgroundMusic();

      this._backgroundMusicInstance = sound.play(this._backgroundMusic, {
        volume: this._volume * 2,
        loop: true,
      });
    } catch (error) {
      console.error("SoundManager: Failed to start background music:", error);
    }
  }

  public stopBackgroundMusic(): void {
    if (this._backgroundMusicInstance) {
      try {
        sound.stop(this._backgroundMusic);
        this._backgroundMusicInstance = null;
      } catch (error) {
        console.error("SoundManager: Failed to stop background music:", error);
      }
    }
  }

  public startSpinningSound(): any {
    if (!this._soundsLoaded || this._soundEffectsMuted) {
      return null;
    }

    try {
      this.stopAllSpinningSounds();

      const spinningInstance = sound.play(this._spinningSound, {
        volume: this._volume * 0.2,
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

  public stopSpinningSound(): void {
    try {
      sound.stop(this._spinningSound);

      this._spinningInstances = [];
    } catch (error) {
      console.error("SoundManager: Failed to stop spinning sound:", error);
    }
  }

  public stopAllSpinningSounds(): void {
    try {
      sound.stop(this._spinningSound);

      this._spinningInstances = [];
    } catch (error) {
      console.error("SoundManager: Failed to stop all spinning sounds:", error);
    }
  }

  public setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));

    sound.volumeAll = this._volume;

    // Restart background music with new volume if it's currently playing
    if (this._backgroundMusicInstance) {
      try {
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

  public getVolume(): number {
    return this._volume;
  }

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

  public isMuted(): boolean {
    return this._isMuted;
  }

  public setSoundEffectsMuted(muted: boolean): void {
    this._soundEffectsMuted = muted;
  }

  public isSoundEffectsMuted(): boolean {
    return this._soundEffectsMuted;
  }

  public stopAll(): void {
    this.stopAllSpinningSounds();
    sound.stopAll();
    this._backgroundMusicInstance = null;
  }

  public isReady(): boolean {
    return this._soundsLoaded;
  }

  public destroy(): void {
    this.stopBackgroundMusic();
    this.stopAllSpinningSounds();
    sound.removeAll();
    this._soundsLoaded = false;
  }
}
