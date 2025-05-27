const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

class HeroCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value) {
        const item = {
            data: value,
            timestamp: Date.now()
        };
        this.cache.set(key, item);
        // Persist to localStorage
        try {
            localStorage.setItem(`heroCache_${key}`,
                JSON.stringify(item)
            );
        } catch (e) {
            // Fallback: ignore if localStorage is unavailable
        }
    }

    get(key) {
        // Try localStorage first
        try {
            const raw = localStorage.getItem(`heroCache_${key}`);
            if (raw) {
                const cached = JSON.parse(raw);
                const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
                if (isExpired) {
                    localStorage.removeItem(`heroCache_${key}`);
                    this.cache.delete(key);
                    return null;
                }
                // Sync in-memory cache too
                this.cache.set(key, cached);
                return cached.data;
            }
        } catch (e) {
            // Fallback to in-memory
        }
        // In-memory fallback
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
        // Clear localStorage cache
        if (typeof localStorage !== 'undefined') {
            Object.keys(localStorage)
                .filter(k => k.startsWith('heroCache_'))
                .forEach(k => localStorage.removeItem(k));
        }
    }
}

// Shared cache for marketplace data
class MarketplaceCache {
    constructor() {
        this.cache = new Map();
        this.listedHeroes = null;
        this.listedTimestamp = null;
    }

    setListedHeroes(heroes) {
        this.listedHeroes = heroes;
        this.listedTimestamp = Date.now();
        // console.log(`[HONK] Cached ${heroes.length} marketplace heroes`);
    }

    getListedHeroes() {
        if (!this.listedHeroes || !this.listedTimestamp) return null;

        const isExpired = Date.now() - this.listedTimestamp > CACHE_DURATION;
        if (isExpired) {
            this.listedHeroes = null;
            this.listedTimestamp = null;
            return null;
        }

        // console.log(`[HONK] Using cached marketplace heroes (${this.listedHeroes.length})`);
        return this.listedHeroes;
    }

    clearListedHeroes() {
        this.listedHeroes = null;
        this.listedTimestamp = null;
        // console.log('[HONK] Cleared marketplace heroes cache');
    }
}

export const heroCache = new HeroCache();
export const marketplaceCache = new MarketplaceCache();
