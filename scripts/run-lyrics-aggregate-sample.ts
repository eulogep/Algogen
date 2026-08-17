import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { analyzeLoveLyrics, type AggregateLyricSong } from "../lib/lyrics-optimizer";

const DEFAULT_SOURCE = path.join(process.cwd(), ".cache", "musixmatch", "mxm_dataset_train.txt");
const OUTPUT_DIR = path.join(process.cwd(), "reports");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "love-lyrics-aggregate-sample.json");
const SAMPLE_MODULUS = 97;
const SAMPLE_THRESHOLD = 5;

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

async function loadSample(sourcePath: string): Promise<AggregateLyricSong[]> {
  if (!existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}. Download the official musiXmatch bag-of-words file to .cache/musixmatch/ first.`);
  }

  const lines = createInterface({
    input: createReadStream(sourcePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let vocabulary: string[] | null = null;
  const songs: AggregateLyricSong[] = [];

  for await (const line of lines) {
    if (line.startsWith("%")) {
      vocabulary = line.slice(1).split(",");
      continue;
    }
    if (!vocabulary || line.startsWith("#") || !line.startsWith("TR")) continue;

    const columns = line.split(",");
    const trackId = columns[0];
    const serializedCounts = columns.slice(2);
    if (stableHash(trackId) % SAMPLE_MODULUS >= SAMPLE_THRESHOLD) continue;

    const counts = parseCounts(serializedCounts, vocabulary);
    if (Object.keys(counts).length > 0) {
      songs.push({
        id: trackId,
        stratum: "musixmatch-random-sample",
        language: "und",
        counts,
      });
    }
  }

  return songs;
}

async function main() {
  const sourcePath = process.env.MXM_BOW_PATH ?? DEFAULT_SOURCE;
  const songs = await loadSample(sourcePath);
  const analysis = analyzeLoveLyrics({
    dataset: {
      name: "musiXmatch Dataset — deterministic aggregate sample",
      version: "Million Song Dataset companion release",
      source_url: "http://millionsongdataset.com/musixmatch/",
      licence_note: "Bag-of-words representation only; no complete lyrics are processed or exported.",
      terms_are_stemmed: true,
    },
    songs,
    options: {
      min_love_documents: 50,
      min_document_coverage: 0.01,
      palette_size: 12,
    },
  });

  const report = {
    generated_at: new Date().toISOString(),
    sample_rule: `stableHash(track_id) % ${SAMPLE_MODULUS} < ${SAMPLE_THRESHOLD}`,
    input_documents: songs.length,
    result: analysis,
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote aggregate-only analysis to ${OUTPUT_PATH}`);
  console.log(JSON.stringify({
    documents: analysis.diagnostics.total_documents,
    love_documents: analysis.diagnostics.love_documents,
    top_terms: analysis.optimized_palette.map((term) => term.term),
    top_associations: analysis.associations.slice(0, 5),
  }, null, 2));
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown sample runner error";
  console.error(message);
  process.exitCode = 1;
});
