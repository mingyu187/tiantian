const KEY_MAP = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    KeyW: "up",
    KeyS: "down",
    KeyA: "left",
    KeyD: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
    W: "up",
    S: "down",
    A: "left",
    D: "right",
};

export class InputHandler {
    constructor() {
        this.onDirection = null;
        this.onTogglePause = null;
        this.onRestart = null;

        this.bindKeyboard();
        this.bindTouch();
        this.bindMobileButtons();
    }

    bindKeyboard() {
        document.addEventListener("keydown", (e) => {
            if (KEY_MAP[e.code] || KEY_MAP[e.key]) {
                e.preventDefault();
                const dir = KEY_MAP[e.code] || KEY_MAP[e.key];
                if (this.onDirection) this.onDirection(dir);
                return;
            }

            if (e.code === "Space") {
                e.preventDefault();
                if (this.onTogglePause) this.onTogglePause();
            }

            if (e.code === "KeyR") {
                e.preventDefault();
                if (this.onRestart) this.onRestart();
            }
        });
    }

    bindMobileButtons() {
        const buttons = document.querySelectorAll(".d-btn");
        buttons.forEach((btn) => {
            const dir = btn.dataset.dir;
            const handler = (e) => {
                e.preventDefault();
                if (this.onDirection) this.onDirection(dir);
            };
            btn.addEventListener("click", handler);
            btn.addEventListener("touchstart", handler, { passive: false });
        });
    }

    bindTouch() {
        let touchStartX = 0;
        let touchStartY = 0;
        const canvas = document.getElementById("game-canvas");

        if (!canvas) return;

        canvas.addEventListener(
            "touchstart",
            (e) => {
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            },
            { passive: true }
        );

        canvas.addEventListener(
            "touchend",
            (e) => {
                const touch = e.changedTouches[0];
                const dx = touch.clientX - touchStartX;
                const dy = touch.clientY - touchStartY;
                const minSwipe = 30;

                if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 0 && this.onDirection) this.onDirection("right");
                    else if (dx < 0 && this.onDirection) this.onDirection("left");
                } else {
                    if (dy > 0 && this.onDirection) this.onDirection("down");
                    else if (dy < 0 && this.onDirection) this.onDirection("up");
                }
            },
            { passive: true }
        );
    }
}
