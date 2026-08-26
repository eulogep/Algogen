import crypto from 'crypto';
import type { StrategyResponse } from './anthropic';
import { createClient } from '@supabase/supabase-js';

// --- Types ---
export interface CacheEntry {
  strategy: StrategyResponse;
  generatedAt: number;
  hitCount: number;
  source: "l1" | "l2";
}

export interface CacheStats {
  l1Hits: number;
  l2Hits: number;
  misses: number;
  totalRequests: number;
  l1HitRate: number; // %
  l2HitRate: number; // %
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue | undefined }
  | JsonValue[];

// --- Configuration L1 ---
const TTL_MS = 60 * 60 * 1000; // 1 heure
const MAX_L1_SIZE = 500;
const l1Cache = new Map<string, CacheEntry>();

// --- Variables Statistiques ---
const stats: CacheStats = {
  l1Hits: 0,
  l2Hits: 0,
  misses: 0,
  totalRequests: 0,
  l1HitRate: 0,
  l2HitRate: 0,
};

// --- Initialisation L2 (Supabase) ---
// Utilisation du Service Role Key pour contourner le RLS si nécessaire
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

/**
 * Nettoyage automatique des entrées L1 expirées
 */
function cleanupL1() {
  const now = Date.now();
  for (const [key, entry] of l1Cache.entries()) {
    if (now - entry.generatedAt > TTL_MS) {
      l1Cache.delete(key);
    }
  }
}

/**
 * Génère une clé de cache SHA256 unique basée sur le profil et la plateforme
 */
export function generateCacheKey<T extends object>(userProfile: T, platformName: string): string {
  const profile = userProfile as Record<string, unknown>;
  const dataToHash = JSON.stringify({
    niche: profile.niche,
    contentType: profile.contentType,
    targetAudience: profile.targetAudience,
    objective: profile.objective,
    level: profile.level,
    platform: platformName
  });

  return crypto.createHash('sha256').update(dataToHash).digest('hex');
}

/**
 * Recherche dans le cache Hybride (L1 mémoire -> L2 Supabase)
 */
export async function getCache(key: string, platformName: string): Promise<StrategyResponse | null> {
  stats.totalRequests++;
  cleanupL1();

  // 1️⃣ L1 CACHE (In-Memory)
  const l1Entry = l1Cache.get(key);
  if (l1Entry && (Date.now() - l1Entry.generatedAt) <= TTL_MS) {
    stats.l1Hits++;
    l1Entry.hitCount++;
    console.log(`✅ L1 Cache HIT (${key}) - ${l1Entry.hitCount} times`);
    updateStatsRates();
    return l1Entry.strategy;
  }

  // 2️⃣ L2 CACHE (Supabase)
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('strategy_cache')
        .select('strategy')
        .eq('platform', platformName)
        .eq('profile_hash', key)
        .single();

      if (data && !error && data.strategy) {
        stats.l2Hits++;
        console.log(`✅ L2 Cache HIT (Supabase) for key ${key}`);
        
        // Promouvoir en L1 pour la prochaine fois
        saveToL1(key, data.strategy as StrategyResponse);

        // Async Background : increment hit_count
        supabase.rpc('increment_cache_hit', { p_hash: key, p_platform: platformName })
        .then(({error: rpcError}) => {
          if (rpcError) {
             // Fallback to update if RPC not present
             supabase.from('strategy_cache')
               .update({ last_accessed_at: new Date().toISOString() })
               .eq('platform', platformName)
               .eq('profile_hash', key)
               .then();
          }
        });

        updateStatsRates();
        return data.strategy as StrategyResponse;
      }
    } catch (e) {
      console.warn("⚠️ L2 Cache read failed. Falling back to L3...", e);
    }
  }

  // 3️⃣ CACHE MISS
  stats.misses++;
  console.log(`❌ Cache MISS for key ${key} (will call API)`);
  updateStatsRates();
  return null;
}

/**
 * Sauvegarde la stratégie en L1 (Synchrone) et en L2 (Asynchrone Fire-and-Forget)
 */
export async function setCache(key: string, platformName: string, strategy: StrategyResponse): Promise<void> {
  // 📦 Sauvegarde L1
  saveToL1(key, strategy);
  console.log(`📦 Cached strategy in L1 (${key})`);

  // 💾 Sauvegarde L2
  if (supabase) {
    supabase.from('strategy_cache').upsert({
      platform: platformName,
      profile_hash: key,
      strategy: strategy as unknown as JsonValue,
    }, { onConflict: 'platform, profile_hash' })
    .then(({ error }) => {
      if (error) {
        console.error(`Erreur L2 upsert:`, error);
      } else {
        console.log(`💾 Cached strategy in L2 (Supabase) for key ${key}`);
      }
    });
  }
}

/**
 * Helper : Sauvegarde dans Pointeur mémoire avec limitation LRU
 */
function saveToL1(key: string, strategy: StrategyResponse) {
  if (l1Cache.size >= MAX_L1_SIZE) {
    const firstKey = l1Cache.keys().next().value;
    if (firstKey) l1Cache.delete(firstKey);
  }
  
  l1Cache.set(key, {
    strategy,
    generatedAt: Date.now(),
    hitCount: 1,
    source: "l1"
  });
}

/**
 * Mise à jour des pourcentages du dashboard
 */
function updateStatsRates() {
  if (stats.totalRequests > 0) {
    stats.l1HitRate = Math.round((stats.l1Hits / stats.totalRequests) * 100);
    stats.l2HitRate = Math.round((stats.l2Hits / stats.totalRequests) * 100);
  }
}

/**
 * Exporte l'instantané des métriques
 */
export function getCacheStats(): CacheStats {
  return { ...stats };
}
