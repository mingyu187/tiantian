const BEST_SCORE_KEY = "snake_best_score";

export class StorageManager {
    static getBestScore() {
        try {
            const value = localStorage.getItem(BEST_SCORE_KEY);
            return value ? parseInt(value, 10) : 0;
        } catch {
            return 0;
        }
    }

    static setBestScore(score) {
        try {
            localStorage.setItem(BEST_SCORE_KEY, String(score));
        } catch {
            // ignore storage errors (e.g., private browsing)
        }
    }

    static updateBestScore(score) {
        const current = StorageManager.getBestScore();
        if (score > current) {
            StorageManager.setBestScore(score);
            return true;
        }
        return false;
    }
}
