import path from "path";
import fs from "fs";
import type { AlgorithmData, KnowledgeBaseMetadata, PlatformId, SocialAlgorithmsDB } from "./types";

let _cache: SocialAlgorithmsDB | null = null;

export function loadAlgorithmsDB(): SocialAlgorithmsDB {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), "data", "social_algorithms.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  _cache = JSON.parse(raw) as SocialAlgorithmsDB;
  return _cache;
}

export function getPlatformData(platformId: PlatformId): AlgorithmData | null {
  const db = loadAlgorithmsDB();
  return db.platforms[platformId] ?? null;
}

export function getKnowledgeBaseMetadata(): KnowledgeBaseMetadata {
  return loadAlgorithmsDB()._meta;
}
