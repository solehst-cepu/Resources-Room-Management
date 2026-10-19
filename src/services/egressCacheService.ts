// Egress Cache Manager & Bandwidth Optimization Service
// Designed to minimize Supabase Data Egress (Bandwidth Out) by caching static master data,
// limiting query payloads, preventing redundant queries, and tracking egress savings.

interface CacheEntry<T = any> {
  timestamp: number;
  ttlMs: number;
  data: T;
  source: 'cache' | 'network';
}

const CACHE_PREFIX = 'lazuardi_egress_cache_';
const METRICS_KEY = 'lazuardi_egress_metrics';
const CONFIG_KEY = 'lazuardi_egress_config';

// Default TTL configurations (in milliseconds)
export const CACHE_TTL = {
  MASTER_STATIC: 24 * 60 * 60 * 1000,   // 24 hours (units, departments, role_configs, suppliers, locations)
  CATALOG: 4 * 60 * 60 * 1000,           // 4 hours (items, uniforms, vehicle_fleet, water_locations)
  TRANSACTIONS: 3 * 60 * 1000,           // 3 minutes (service_requests, stock_transactions, water_provider_logs)
  HEALTH_CHECK: 60 * 1000,               // 60 seconds (Supabase health status)
};

export interface EgressMetrics {
  totalQueriesSaved: number;
  estimatedBytesSaved: number;
  cacheHits: number;
  networkRequests: number;
  lastReset: string;
}

export interface EgressOptimizationConfig {
  enableCache: boolean;
  maxRecentLogsLimit: number; // e.g. 50, 100, 200
  defaultPageSize: number;    // e.g. 10, 25, 50
  enableSelectiveProjection: boolean;
  autoInvalidateOnRealtime: boolean;
}

const DEFAULT_CONFIG: EgressOptimizationConfig = {
  enableCache: true,
  maxRecentLogsLimit: 100,
  defaultPageSize: 25,
  enableSelectiveProjection: true,
  autoInvalidateOnRealtime: true,
};

// Load configuration
export function getEgressConfig(): EgressOptimizationConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_CONFIG;
}

// Save configuration
export function saveEgressConfig(config: Partial<EgressOptimizationConfig>): EgressOptimizationConfig {
  try {
    const current = getEgressConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_CONFIG;
  }
}

// Load metrics from LocalStorage
function loadMetrics(): EgressMetrics {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    totalQueriesSaved: 0,
    estimatedBytesSaved: 0,
    cacheHits: 0,
    networkRequests: 0,
    lastReset: new Date().toISOString(),
  };
}

// Save metrics
function saveMetrics(metrics: EgressMetrics) {
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  } catch {
    // ignore
  }
}

/**
 * Get data from local egress cache
 */
export function getEgressCache<T>(key: string): { data: T; isExpired: boolean; ageMs: number } | null {
  const config = getEgressConfig();
  if (!config.enableCache) return null;

  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const now = Date.now();
    const ageMs = now - entry.timestamp;
    const isExpired = ageMs > entry.ttlMs;

    return {
      data: entry.data,
      isExpired,
      ageMs,
    };
  } catch (err) {
    console.warn(`[EgressCache] Error reading cache for [${key}]:`, err);
    return null;
  }
}

/**
 * Set data in local egress cache with specified TTL
 */
export function setEgressCache<T>(key: string, data: T, ttlMs: number = CACHE_TTL.MASTER_STATIC): void {
  const config = getEgressConfig();
  if (!config.enableCache) return;

  try {
    const entry: CacheEntry<T> = {
      timestamp: Date.now(),
      ttlMs,
      data,
      source: 'cache',
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (err) {
    console.warn(`[EgressCache] Error writing cache for [${key}]:`, err);
  }
}

/**
 * Invalidate specific or all egress cache keys
 */
export function invalidateEgressCache(key?: string): void {
  try {
    if (key) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } else {
      // Clear all egress cache
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (err) {
    console.warn('[EgressCache] Error invalidating cache:', err);
  }
}

/**
 * List all currently cached tables in localStorage with size and age info
 */
export interface CachedTableInfo {
  key: string;
  tableName: string;
  ageMs: number;
  ttlMs: number;
  isExpired: boolean;
  sizeBytes: number;
  itemCount: number;
  lastUpdated: string;
}

export function listEgressCachedTables(): CachedTableInfo[] {
  const list: CachedTableInfo[] = [];
  try {
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        const tableName = k.replace(CACHE_PREFIX, '');
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const entry: CacheEntry<any> = JSON.parse(raw);
            const ageMs = now - entry.timestamp;
            const itemCount = Array.isArray(entry.data) ? entry.data.length : 1;
            list.push({
              key: k,
              tableName,
              ageMs,
              ttlMs: entry.ttlMs,
              isExpired: ageMs > entry.ttlMs,
              sizeBytes: raw.length * 2, // approximate UTF-16 bytes
              itemCount,
              lastUpdated: new Date(entry.timestamp).toLocaleTimeString('id-ID'),
            });
          } catch {
            // ignore bad entry
          }
        }
      }
    }
  } catch (err) {
    console.warn('[EgressCache] Error listing cached tables:', err);
  }
  return list.sort((a, b) => a.tableName.localeCompare(b.tableName));
}

/**
 * Record a cache hit or network request to track egress savings
 */
export function recordEgressMetric(type: 'hit' | 'network', estimatedBytes: number = 2500): void {
  const metrics = loadMetrics();
  if (type === 'hit') {
    metrics.cacheHits += 1;
    metrics.totalQueriesSaved += 1;
    metrics.estimatedBytesSaved += estimatedBytes;
  } else {
    metrics.networkRequests += 1;
  }
  saveMetrics(metrics);
}

/**
 * Get current Egress metrics & savings summary
 */
export function getEgressSavingsSummary(): EgressMetrics & {
  hitRatioPercent: number;
  formattedBytesSaved: string;
} {
  const metrics = loadMetrics();
  const total = metrics.cacheHits + metrics.networkRequests;
  const hitRatio = total > 0 ? Math.round((metrics.cacheHits / total) * 100) : 100;

  const bytes = metrics.estimatedBytesSaved;
  let formatted = '0 KB';
  if (bytes > 1024 * 1024) {
    formatted = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else if (bytes > 1024) {
    formatted = `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    formatted = `${bytes} B`;
  }

  return {
    ...metrics,
    hitRatioPercent: hitRatio,
    formattedBytesSaved: formatted,
  };
}

/**
 * Reset egress metrics counter
 */
export function resetEgressMetrics(): void {
  saveMetrics({
    totalQueriesSaved: 0,
    estimatedBytesSaved: 0,
    cacheHits: 0,
    networkRequests: 0,
    lastReset: new Date().toISOString(),
  });
}
