import { GRID_SIZE, CELL_SIZE, CANVAS_SIZE, DIRECTIONS } from "./game.js";

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.resize();
        this.setupResponsive();
    }

    resize() {
        this.canvas.width = CANVAS_SIZE * this.devicePixelRatio;
        this.canvas.height = CANVAS_SIZE * this.devicePixelRatio;
        this.ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
    }

    setupResponsive() {
        const wrapper = this.canvas.parentElement;
        const resizeObserver = new ResizeObserver(() => {
            const rect = wrapper.getBoundingClientRect();
            const size = Math.min(rect.width - 4, 560);
            this.canvas.style.width = `${size}px`;
            this.canvas.style.height = `${size}px`;
        });
        resizeObserver.observe(wrapper);
    }

    clear() {
        this.ctx.fillStyle = "#0f172a";
        this.ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = "rgba(71, 85, 105, 0.15)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            const pos = i * CELL_SIZE + 0.5;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(CANVAS_SIZE, pos);
            ctx.stroke();
        }
    }

    drawSnake(snake, direction, interpolation) {
        if (snake.length === 0) return;
        const ctx = this.ctx;

        for (let i = snake.length - 1; i >= 0; i--) {
            const segment = snake[i];
            const isHead = i === 0;

            let drawX = segment.x * CELL_SIZE;
            let drawY = segment.y * CELL_SIZE;

            if (isHead && interpolation > 0 && snake.length > 1) {
                const dir = DIRECTIONS[direction];
                const t = 1 - interpolation;
                drawX -= dir.x * CELL_SIZE * t;
                drawY -= dir.y * CELL_SIZE * t;
            }

            const pad = isHead ? 1 : 2;
            const size = CELL_SIZE - pad * 2;
            const radius = isHead ? 6 : 5;

            if (isHead) {
                const gradient = ctx.createLinearGradient(
                    drawX, drawY, drawX + CELL_SIZE, drawY + CELL_SIZE
                );
                gradient.addColorStop(0, "#4ade80");
                gradient.addColorStop(1, "#16a34a");
                ctx.fillStyle = gradient;

                ctx.shadowColor = "rgba(34, 197, 94, 0.6)";
                ctx.shadowBlur = 12;
            } else {
                const t = i / snake.length;
                const green = Math.round(180 - t * 80);
                ctx.fillStyle = `rgb(34, ${green}, 94)`;
                ctx.shadowBlur = 0;
            }

            this.roundRect(ctx, drawX + pad, drawY + pad, size, size, radius);
            ctx.fill();

            if (isHead) {
                ctx.shadowBlur = 0;
                this.drawEyes(drawX, drawY, direction);
            }
        }
    }

    drawEyes(headX, headY, direction) {
        const ctx = this.ctx;
        const cx = headX + CELL_SIZE / 2;
        const cy = headY + CELL_SIZE / 2;
        const eyeOffset = 4;
        const eyeSize = 2.5;

        ctx.fillStyle = "#0f172a";

        let e1x, e1y, e2x, e2y;
        switch (direction) {
            case "up":
                e1x = cx - eyeOffset; e1y = cy - eyeOffset;
                e2x = cx + eyeOffset; e2y = cy - eyeOffset;
                break;
            case "down":
                e1x = cx - eyeOffset; e1y = cy + eyeOffset;
                e2x = cx + eyeOffset; e2y = cy + eyeOffset;
                break;
            case "left":
                e1x = cx - eyeOffset; e1y = cy - eyeOffset;
                e2x = cx - eyeOffset; e2y = cy + eyeOffset;
                break;
            case "right":
                e1x = cx + eyeOffset; e1y = cy - eyeOffset;
                e2x = cx + eyeOffset; e2y = cy + eyeOffset;
                break;
        }

        ctx.beginPath();
        ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFood(food, animationTime) {
        if (!food) return;
        const ctx = this.ctx;
        const x = food.x * CELL_SIZE + CELL_SIZE / 2;
        const y = food.y * CELL_SIZE + CELL_SIZE / 2;

        const pulse = Math.sin(animationTime * 0.006) * 0.15 + 1;
        const baseRadius = (CELL_SIZE / 2 - 3) * pulse;

        ctx.save();

        const glow = ctx.createRadialGradient(x, y, 0, x, y, CELL_SIZE);
        glow.addColorStop(0, "rgba(239, 68, 68, 0.4)");
        glow.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(
            food.x * CELL_SIZE - CELL_SIZE / 2,
            food.y * CELL_SIZE - CELL_SIZE / 2,
            CELL_SIZE * 2,
            CELL_SIZE * 2
        );

        const gradient = ctx.createRadialGradient(
            x - 2, y - 2, 0, x, y, baseRadius
        );
        gradient.addColorStop(0, "#fca5a5");
        gradient.addColorStop(0.5, "#ef4444");
        gradient.addColorStop(1, "#991b1b");
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(x - baseRadius * 0.3, y - baseRadius * 0.3, baseRadius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawEffects(effects) {
        const ctx = this.ctx;
        const now = performance.now();

        for (const effect of effects) {
            const elapsed = now - effect.startTime;
            const progress = elapsed / effect.duration;

            if (effect.type === "eat") {
                const cx = effect.x * CELL_SIZE + CELL_SIZE / 2;
                const cy = effect.y * CELL_SIZE + CELL_SIZE / 2;
                const radius = CELL_SIZE * (0.5 + progress * 1.5);
                const alpha = 1 - progress;

                ctx.save();
                ctx.strokeStyle = `rgba(234, 179, 8, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = `rgba(250, 204, 21, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    render(renderState) {
        this.clear();
        this.drawGrid();
        this.drawEffects(renderState.effects);
        this.drawFood(renderState.food, renderState.animationTime);
        this.drawSnake(
            renderState.snake,
            renderState.direction,
            renderState.interpolation
        );
    }
}
