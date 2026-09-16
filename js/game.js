export const GRID_SIZE = 24;
export const CELL_SIZE = 20;
export const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

export const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};

export const OPPOSITES = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
};

export const GameState = {
    IDLE: "idle",
    RUNNING: "running",
    PAUSED: "paused",
    GAME_OVER: "game_over",
};

export class SnakeGame {
    constructor(speed = 120) {
        this.speed = speed;
        this.state = GameState.IDLE;
        this.score = 0;
        this.lastTickTime = 0;
        this.accumulator = 0;
        this.rafId = null;
        this.animationTime = 0;

        this.onScoreChange = null;
        this.onStateChange = null;
        this.onEatFood = null;
        this.onGameOver = null;

        this.inputQueue = [];

        this.init();
    }

    init() {
        const startX = Math.floor(GRID_SIZE / 2);
        const startY = Math.floor(GRID_SIZE / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY },
        ];
        this.direction = "right";
        this.pendingDirection = "right";
        this.score = 0;
        this.inputQueue = [];
        this.food = this.spawnFood();
        this.effects = [];

        if (this.onScoreChange) this.onScoreChange(this.score);
    }

    reset() {
        this.init();
        this.state = GameState.IDLE;
        if (this.onStateChange) this.onStateChange(this.state);
    }

    spawnFood() {
        const occupied = new Set(this.snake.map((s) => `${s.x},${s.y}`));
        const emptyCells = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!occupied.has(`${x},${y}`)) {
                    emptyCells.push({ x, y });
                }
            }
        }
        if (emptyCells.length === 0) return null;
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    queueDirection(dir) {
        if (!DIRECTIONS[dir]) return;
        const lastDir =
            this.inputQueue.length > 0
                ? this.inputQueue[this.inputQueue.length - 1]
                : this.pendingDirection;
        if (dir === lastDir || dir === OPPOSITES[lastDir]) return;
        if (this.inputQueue.length >= 3) return;
        this.inputQueue.push(dir);
    }

    start() {
        if (this.state === GameState.RUNNING) return;
        if (this.state === GameState.GAME_OVER) this.init();
        this.state = GameState.RUNNING;
        this.lastTickTime = performance.now();
        this.accumulator = 0;
        if (this.onStateChange) this.onStateChange(this.state);
        this.rafId = requestAnimationFrame(this.loop);
    }

    pause() {
        if (this.state !== GameState.RUNNING) return;
        this.state = GameState.PAUSED;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        if (this.onStateChange) this.onStateChange(this.state);
    }

    togglePause() {
        if (this.state === GameState.RUNNING) this.pause();
        else if (this.state === GameState.PAUSED) this.resume();
        else if (this.state === GameState.IDLE || this.state === GameState.GAME_OVER) this.start();
    }

    resume() {
        if (this.state !== GameState.PAUSED) return;
        this.state = GameState.RUNNING;
        this.lastTickTime = performance.now();
        this.accumulator = 0;
        if (this.onStateChange) this.onStateChange(this.state);
        this.rafId = requestAnimationFrame(this.loop);
    }

    stop() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        if (this.onStateChange) this.onStateChange(this.state);
        if (this.onGameOver) this.onGameOver(this.score);
    }

    tick() {
        if (this.inputQueue.length > 0) {
            const nextDir = this.inputQueue.shift();
            if (nextDir !== OPPOSITES[this.direction]) {
                this.pendingDirection = nextDir;
            }
        }

        this.direction = this.pendingDirection;
        const dir = DIRECTIONS[this.direction];
        const head = this.snake[0];
        const newHead = { x: head.x + dir.x, y: head.y + dir.y };

        if (
            newHead.x < 0 ||
            newHead.x >= GRID_SIZE ||
            newHead.y < 0 ||
            newHead.y >= GRID_SIZE
        ) {
            this.gameOver();
            return;
        }

        for (let i = 0; i < this.snake.length - 1; i++) {
            if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(newHead);

        if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += 10;
            if (this.onScoreChange) this.onScoreChange(this.score);
            if (this.onEatFood) this.onEatFood(newHead);
            this.effects.push({
                type: "eat",
                x: newHead.x,
                y: newHead.y,
                startTime: performance.now(),
                duration: 400,
            });
            this.food = this.spawnFood();
        } else {
            this.snake.pop();
        }
    }

    loop = (now) => {
        if (this.state !== GameState.RUNNING) return;

        const delta = now - this.lastTickTime;
        this.lastTickTime = now;
        this.accumulator += delta;
        this.animationTime += delta;

        while (this.accumulator >= this.speed) {
            this.tick();
            this.accumulator -= this.speed;
            if (this.state !== GameState.RUNNING) return;
        }

        this.renderInterpolation = Math.min(this.accumulator / this.speed, 1);
        this.rafId = requestAnimationFrame(this.loop);
    };

    getRenderState() {
        const now = performance.now();
        this.effects = this.effects.filter(
            (e) => now - e.startTime < e.duration
        );
        return {
            snake: this.snake,
            direction: this.direction,
            food: this.food,
            state: this.state,
            score: this.score,
            interpolation: this.renderInterpolation || 0,
            effects: this.effects,
            animationTime: this.animationTime,
        };
    }
}
