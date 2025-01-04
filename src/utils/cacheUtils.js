const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

class HeroCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value) {
        this.cache.set(key, {
            data: value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    clear() {
        this.cache.clear();
    }
}

export const heroCache = new HeroCache();
