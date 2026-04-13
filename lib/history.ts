// ── History utility (client-side only, uses localStorage) ────────────────────
// This module must only be imported in "use client" components.

import type { HistoryEntry, PlatformId, AnalyzeResponse, Objective, Level } from "./types";

const STORAGE_KEY = "algolens_history";
const MAX_ENTRIES = 50;

// ── Read ─────────────────────────────────────────────────────────────────────
export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

// ── Write ────────────────────────────────────────────────────────────────────
export function saveToHistory(
  platformId: PlatformId,
  niche: string,
  objective: Objective,
  level: Level,
  strategy: AnalyzeResponse
): HistoryEntry {
  const entry: HistoryEntry = {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`,
    platformId,
    niche,
    objective,
    level,
    score: strategy.potential_score ?? 0,
    date: new Date().toISOString(),
    strategy,
  };

  try {
    const existing = getHistory();
    // Prepend newest, cap at MAX_ENTRIES
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage quota exceeded — silently skip
  }

  return entry;
}

// ── Delete ────────────────────────────────────────────────────────────────────
export function deleteFromHistory(id: string): void {
  try {
    const existing = getHistory();
    const updated = existing.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// ── Clear all ─────────────────────────────────────────────────────────────────
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
