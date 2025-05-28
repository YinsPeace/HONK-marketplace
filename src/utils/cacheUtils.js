const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_LOCALSTORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for localStorage

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
        
        // Only try localStorage for smaller datasets to avoid quota exceeded errors
        try {
            const serialized = JSON.stringify(item);
            // Skip localStorage if the data is too large (likely 30k+ heroes)
            if (serialized.length < MAX_LOCALSTORAGE_SIZE) {
                localStorage.setItem(`heroCache_${key}`, serialized);
            } else {
                // console.log(`[HONK] Skipping localStorage cache for large dataset (${serialized.length} bytes)`);
                // Remove any existing localStorage entry for this key
                localStorage.removeItem(`heroCache_${key}`);
            }
        } catch (e) {
            // console.warn('[HONK] Failed to store in localStorage:', e.message);
            // Try to clean up old cache entries if quota exceeded
            if (e.name === 'QuotaExceededError') {
                this.clearLocalStorageCache();
            }
        }
    }

    get(key) {
        // Try localStorage first only if it's likely to be there (smaller datasets)
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
            // Clean up corrupted localStorage entry
            try {
                localStorage.removeItem(`heroCache_${key}`);
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
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

    clearLocalStorageCache() {
        if (typeof localStorage !== 'undefined') {
            try {
            Object.keys(localStorage)
                .filter(k => k.startsWith('heroCache_'))
                .forEach(k => localStorage.removeItem(k));
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }

    clear() {
        this.cache.clear();
        this.clearLocalStorageCache();
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
