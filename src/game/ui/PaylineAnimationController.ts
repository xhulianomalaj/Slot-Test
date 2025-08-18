/**
 * Handles animation sequencing, timing, and skip functionality for paylines
 */
export class PaylineAnimationController {
    private _isCurrentlyAnimating: boolean = false;
    private _skipRequested: boolean = false;
    private _onAnimationStart?: (() => void) | undefined;
    private _onAnimationEnd?: (() => void) | undefined;
    private _onAnimationSkipped?: (() => void) | undefined;
    private _globalClickHandler?: () => void;

    constructor() {
        this.setupGlobalSkipHandler();
    }

    /**
     * Setup global click handler for skipping animations
     */
    private setupGlobalSkipHandler(): void {
        if (globalThis.document) {
            const handleGlobalClick = () => {
                if (this._isCurrentlyAnimating) {
                    this.requestSkip();
                }
            };
            globalThis.document.addEventListener('click', handleGlobalClick);
            globalThis.document.addEventListener('pointerdown', handleGlobalClick);

            // Store reference for cleanup
            this._globalClickHandler = handleGlobalClick;
        }
    }

    /**
     * Set callbacks for animation start/end events
     */
    setAnimationCallbacks(onStart?: () => void, onEnd?: () => void, onSkipped?: () => void): void {
        this._onAnimationStart = onStart;
        this._onAnimationEnd = onEnd;
        this._onAnimationSkipped = onSkipped;
    }

    /**
     * Start animation sequence
     */
    startAnimation(): void {
        this._isCurrentlyAnimating = true;
        this._skipRequested = false;

        // Notify animation start
        if (this._onAnimationStart) {
            this._onAnimationStart();
        }
    }

    /**
     * End animation sequence
     */
    endAnimation(completedNormally: boolean): void {
        this._isCurrentlyAnimating = false;
        this._skipRequested = false;

        // Notify appropriate completion callback
        if (completedNormally && this._onAnimationEnd) {
            this._onAnimationEnd();
        } else if (!completedNormally && this._onAnimationSkipped) {
            this._onAnimationSkipped();
        }
    }

    /**
     * Request to skip current animation
     */
    requestSkip(): void {
        if (!this._isCurrentlyAnimating) return;

        console.log("🎮 Skip animation requested");
        this._skipRequested = true;

        // Kill all running GSAP tweens
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf("*");
        }
    }

    /**
     * Delay that can be skipped
     */
    async skipableDelay(ms: number): Promise<void> {
        if (this._skipRequested) return;

        return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                resolve();
            }, ms);

            // If skip is triggered, resolve immediately
            const checkSkip = () => {
                if (this._skipRequested) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    // Check again in 10ms
                    setTimeout(checkSkip, 10);
                }
            };
            checkSkip();
        });
    }

    /**
     * Get current animation state
     */
    get isCurrentlyAnimating(): boolean {
        return this._isCurrentlyAnimating;
    }

    /**
     * Get skip requested state
     */
    get isSkipRequested(): boolean {
        return this._skipRequested;
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        // Remove global event listeners
        if (this._globalClickHandler && globalThis.document) {
            globalThis.document.removeEventListener('click', this._globalClickHandler);
            globalThis.document.removeEventListener('pointerdown', this._globalClickHandler);
        }
    }
}
