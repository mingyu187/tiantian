export class AudioManager {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.masterGain = null;
    }

    ensureContext() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.3;
                this.masterGain.connect(this.ctx.destination);
            } catch (e) {
                console.warn("Web Audio API not supported");
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    playTone(frequency, duration, type = "sine", volume = 1) {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        const actualVolume = 0.3 * volume;
        gain.gain.setValueAtTime(actualVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            this.ctx.currentTime + duration
        );

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    playEat() {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = "square";
        osc1.frequency.setValueAtTime(600, now);
        osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.15);
    }

    playGameOver() {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [400, 300, 200, 100];

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            gain.gain.setValueAtTime(0.2, now + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.15);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.15);
        });
    }

    playStart() {
        this.playTone(660, 0.1, "triangle", 1);
        setTimeout(() => this.playTone(880, 0.15, "triangle", 1), 100);
    }

    playPause() {
        this.playTone(440, 0.08, "sine", 0.8);
    }
}
