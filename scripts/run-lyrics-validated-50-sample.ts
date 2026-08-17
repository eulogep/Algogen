import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { analyzeLoveLyrics, type AggregateLyricSong } from "../lib/lyrics-optimizer.js";

const DEFAULT_SOURCE = path.join(process.cwd(), ".cache", "musixmatch", "mxm_dataset_train.txt");
const OUTPUT_DIR = path.join(process.cwd(), "reports");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "love-lyrics-validated-50-sample.json");
const SAMPLE_MODULUS = 97;
const SAMPLE_THRESHOLD = 5;

const LOVE_SEEDS = new Set(["love", "lov", "lover", "heart", "kiss", "kissing", "darling", "romanc", "romance", "amour", "coeur", "cœur", "baiser", "passion"]);
const EVIDENCE_FAMILIES = [
  new Set(["love", "lov", "lover", "heart", "kiss", "kissing", "babi", "baby", "darling", "amour", "tender"]),
  new Set(["hold", "togeth", "together", "mine", "need", "feel", "tonight", "memori", "memory", "care"]),
  new Set(["dream", "desir", "desire", "fall", "forev", "forever", "long", "miss", "sweet", "honey"]),
];

type Candidate = AggregateLyricSong & { labelSource: "exploratory" };

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function parseCounts(serializedCounts: string[], vocabulary: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of serializedCounts) {
    const [rawIndex, rawCount] = item.split(":");
    const index = Number.parseInt(rawIndex, 10) - 1;
    const count = Number.parseInt(rawCount, 10);
    const term = vocabulary[index];
    if (term && Number.isFinite(count) && count > 0) counts[term] = count;
  }
  return counts;
}

function evidenceFamilyCount(counts: Record<string, number>): number {
  return EVIDENCE_FAMILIES.reduce(
    (total, family) => total + (Array.from(family).some((term) => (counts[term] ?? 0) > 0) ? 1 : 0),
    0
  );
}

function hasLoveSeed(counts: Record<string, number>): boolean {
  return Array.from(LOVE_SEEDS).some((term) => (counts[term] ?? 0) > 0);
}

async function loadFiftySongSample(sourcePath: string): Promise<Candidate[]> {
  if (!existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}. Download the official musiXmatch bag-of-words file first.`);
  }

  const lines = createInterface({ input: createReadStream(sourcePath, { encoding: "utf8" }), crlfDelay: Infinity });
  let vocabulary: string[] | null = null;
  const strongPositives: Candidate[] = [];
  const weakPositives: Candidate[] = [];
  const baselines: Candidate[] = [];

  for await (const line of lines) {
    if (line.startsWith("%")) {
      vocabulary = line.slice(1).split(",");
      continue;
    }
    if (!vocabulary || line.startsWith("#") || !line.startsWith("TR")) continue;

    const columns = line.split(",");
    const trackId = columns[0];
    if (stableHash(trackId) % SAMPLE_MODULUS >= SAMPLE_THRESHOLD) continue;

    const counts = parseCounts(columns.slice(2), vocabulary);
    if (Object.keys(counts).length === 0) continue;
    const candidate: Candidate = {
      id: trackId,
      stratum: "musixmatch-random-sample",
      language: "und",
      labelSource: "exploratory",
      isLove: true,
      counts,
    };

    const familyCount = evidenceFamilyCount(counts);
    if (hasLoveSeed(counts) && familyCount >= 2 && strongPositives.length < 15) {
      strongPositives.push(candidate);
    } else if (hasLoveSeed(counts) && familyCount === 1 && weakPositives.length < 10) {
      weakPositives.push(candidate);
    } else if (!hasLoveSeed(counts) && baselines.length < 25) {
      baselines.push({ ...candidate, isLove: false });
    }

    if (strongPositives.length === 15 && weakPositives.length === 10 && baselines.length === 25) break;
  }

  if (strongPositives.length !== 15 || weakPositives.length !== 10 || baselines.length !== 25) {
    throw new Error(`Incomplete deterministic sample: strong=${strongPositives.length}, weak=${weakPositives.length}, baseline=${baselines.length}`);
  }
  return [...strongPositives, ...weakPositives, ...baselines];
}

async function main() {
  const sourcePath = process.env.MXM_BOW_PATH ?? DEFAULT_SOURCE;
  const songs = await loadFiftySongSample(sourcePath);
  const dataset = {
    name: "musiXmatch Dataset — 50-song exploratory aggregate sample",
    version: "Million Song Dataset companion release",
    source_url: "http://millionsongdataset.com/musixmatch/",
    licence_note: "Bag-of-words representation only; no complete lyrics are processed or exported.",
    terms_are_stemmed: true,
  };
  const result = analyzeLoveLyrics({
    dataset,
    songs,
    options: {
      max_term_occurrences_per_song: 3,
      min_love_documents: 12,
      min_document_coverage: 0.05,
      palette_size: 12,
      validation_mode: "auto_for_exploratory",
    },
  });

  const report = {
    generated_at: new Date().toISOString(),
    sample_rule: `stableHash(track_id) % ${SAMPLE_MODULUS} < ${SAMPLE_THRESHOLD}`,
    submitted_documents: songs.length,
    exploratory_positive_candidates: 25,
    deliberately_low_evidence_candidates: 10,
    baseline_documents: 25,
    result,
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote validated aggregate analysis to ${OUTPUT_PATH}`);
  console.log(JSON.stringify({
    submitted: result.diagnostics.submitted_documents,
    retained: result.diagnostics.total_documents,
    love_documents: result.diagnostics.love_documents,
    baseline_documents: result.diagnostics.baseline_documents,
    vocabulary_size: result.diagnostics.vocabulary_size,
    validation: result.validation,
    palette: result.optimized_palette.map((term) => term.term),
    associations: result.associations.slice(0, 5),
  }, null, 2));
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown validated sample runner error";
  console.error(message);
  process.exitCode = 1;
});
