import { SnakeGame, GameState } from "./game.js";
import { Renderer } from "./renderer.js";
import { InputHandler } from "./input.js";
import { AudioManager } from "./audio.js";
import { StorageManager } from "./storage.js";
import { UIManager } from "./ui.js";

function main() {
    const canvas = document.getElementById("game-canvas");
    const renderer = new Renderer(canvas);
    const audio = new AudioManager();
    const ui = new UIManager();
    const input = new InputHandler();

    let currentSpeed = 180;

    const game = new SnakeGame(currentSpeed);

    game.onScoreChange = (score) => {
        ui.setScore(score);
    };

    game.onStateChange = (state) => {
        ui.updateStartButton(state);

        if (state === GameState.RUNNING) {
            ui.hideOverlay();
        } else if (state === GameState.PAUSED) {
            ui.showPaused();
            audio.playPause();
        } else if (state === GameState.GAME_OVER) {
            audio.playGameOver();
        }
    };

    game.onEatFood = () => {
        audio.playEat();
    };

    game.onGameOver = (score) => {
        const isNewBest = StorageManager.updateBestScore(score);
        const best = StorageManager.getBestScore();
        ui.setBestScore(best);
        ui.showGameOver(score, isNewBest);
    };

    input.onDirection = (dir) => {
        game.queueDirection(dir);
    };

    input.onTogglePause = () => {
        if (game.state === GameState.IDLE || game.state === GameState.GAME_OVER) {
            game.start();
            audio.playStart();
        } else {
            game.togglePause();
        }
    };

    input.onRestart = () => {
        handleRestart();
    };

    ui.onStart = () => {
        if (game.state === GameState.GAME_OVER) {
            handleRestart();
        } else if (game.state === GameState.PAUSED) {
            game.resume();
        } else {
            game.start();
            audio.playStart();
        }
    };

    ui.onPause = () => {
        game.togglePause();
    };

    ui.onRestart = () => {
        handleRestart();
    };

    ui.onDifficultyChange = (speed) => {
        currentSpeed = speed;
        game.setSpeed(speed);
    };

    ui.onSoundToggle = (enabled) => {
        audio.setEnabled(enabled);
    };

    function handleRestart() {
        game.stop();
        game.reset();
        game.setSpeed(currentSpeed);
        ui.setScore(0);
        game.start();
        audio.playStart();
    }

    function renderLoop() {
        const state = game.getRenderState();
        renderer.render(state);
        requestAnimationFrame(renderLoop);
    }

    const bestScore = StorageManager.getBestScore();
    ui.setBestScore(bestScore);
    ui.setScore(0);
    ui.showIdle();

    renderLoop();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}
