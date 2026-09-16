import { GameState } from "./game.js";

export class UIManager {
    constructor() {
        this.scoreEl = document.getElementById("score");
        this.bestScoreEl = document.getElementById("best-score");
        this.overlay = document.getElementById("overlay");
        this.overlayTitle = document.getElementById("overlay-title");
        this.overlayMessage = document.getElementById("overlay-message");
        this.overlayBtn = document.getElementById("overlay-btn");
        this.startBtn = document.getElementById("start-btn");
        this.restartBtn = document.getElementById("restart-btn");
        this.soundToggle = document.getElementById("sound-toggle");
        this.difficultyButtons = document.querySelectorAll(".btn-difficulty");

        this.onStart = null;
        this.onPause = null;
        this.onRestart = null;
        this.onDifficultyChange = null;
        this.onSoundToggle = null;

        this.bindEvents();
    }

    bindEvents() {
        this.overlayBtn.addEventListener("click", () => {
            if (this.onStart) this.onStart();
        });

        this.startBtn.addEventListener("click", () => {
            if (this.onPause) this.onPause();
        });

        this.restartBtn.addEventListener("click", () => {
            if (this.onRestart) this.onRestart();
        });

        this.soundToggle.addEventListener("change", (e) => {
            if (this.onSoundToggle) this.onSoundToggle(e.target.checked);
        });

        this.difficultyButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                this.difficultyButtons.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                const speed = parseInt(btn.dataset.speed, 10);
                if (this.onDifficultyChange) this.onDifficultyChange(speed);
            });
        });
    }

    setScore(score) {
        this.scoreEl.textContent = score;
        this.scoreEl.classList.remove("pop");
        void this.scoreEl.offsetWidth;
        this.scoreEl.classList.add("pop");
        setTimeout(() => this.scoreEl.classList.remove("pop"), 150);
    }

    setBestScore(score) {
        this.bestScoreEl.textContent = score;
    }

    showOverlay(title, message, btnText = "开始游戏", type = "default") {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlayBtn.textContent = btnText;
        this.overlay.classList.remove("hidden", "game-over", "paused");
        if (type === "game_over") this.overlay.classList.add("game-over");
        if (type === "paused") this.overlay.classList.add("paused");
    }

    hideOverlay() {
        this.overlay.classList.add("hidden");
    }

    showGameOver(score, isNewBest) {
        const msg = isNewBest
            ? `🎉 新纪录！最终得分: ${score}`
            : `最终得分: ${score}`;
        this.showOverlay("游戏结束", msg, "再来一局", "game_over");
    }

    showPaused() {
        this.showOverlay("已暂停", "按 空格键 继续游戏", "继续游戏", "paused");
    }

    showIdle() {
        this.showOverlay("准备好了吗？", "按 空格键 或点击开始按钮开始游戏", "开始游戏");
    }

    updateStartButton(state) {
        if (state === GameState.RUNNING) {
            this.startBtn.textContent = "暂停";
        } else if (state === GameState.PAUSED) {
            this.startBtn.textContent = "继续";
        } else if (state === GameState.GAME_OVER) {
            this.startBtn.textContent = "开始";
        } else {
            this.startBtn.textContent = "开始 / 暂停";
        }
    }
}
