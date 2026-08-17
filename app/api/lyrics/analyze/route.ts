import { NextRequest, NextResponse } from "next/server";
import {
  analyzeLoveLyrics,
  type AggregateLyricSong,
  type LoveLyricsAnalysisRequest,
  type LyricsDatasetMetadata,
} from "@/lib/lyrics-optimizer";
import { withRateLimit } from "@/lib/rate-limit";

const MAX_SONGS = 5_000;
const MAX_TERMS_PER_SONG = 5_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDataset(value: unknown): LyricsDatasetMetadata {
  if (!isRecord(value) || typeof value.name !== "string" || !value.name.trim()) {
    throw new Error("dataset.name is required");
  }

  return {
    name: value.name.trim(),
    version: typeof value.version === "string" ? value.version : undefined,
    source_url: typeof value.source_url === "string" ? value.source_url : undefined,
    licence_note: typeof value.licence_note === "string" ? value.licence_note : undefined,
    terms_are_stemmed: value.terms_are_stemmed === true,
  };
}

function parseSong(value: unknown, index: number): AggregateLyricSong {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id.trim()) {
    throw new Error(`songs[${index}].id is required`);
  }
  if ("lyrics" in value || "text" in value || "raw_text" in value) {
    throw new Error("Raw lyrics are not accepted. Send aggregate term counts only.");
  }
  if (!isRecord(value.counts)) {
    throw new Error(`songs[${index}].counts must be an object of term counts`);
  }

  const entries = Object.entries(value.counts);
  if (entries.length === 0 || entries.length > MAX_TERMS_PER_SONG) {
    throw new Error(`songs[${index}].counts must contain between 1 and ${MAX_TERMS_PER_SONG} terms`);
  }

  const counts: Record<string, number> = {};
  for (const [term, count] of entries) {
    if (typeof count === "number" && Number.isFinite(count) && count > 0) {
      counts[term] = count;
    }
  }

  return {
    id: value.id.trim(),
    year: typeof value.year === "number" && Number.isInteger(value.year) ? value.year : undefined,
    language: typeof value.language === "string" ? value.language : undefined,
    stratum: typeof value.stratum === "string" ? value.stratum : undefined,
    isLove: typeof value.isLove === "boolean" ? value.isLove : undefined,
    counts,
  };
}

function parseRequest(value: unknown): LoveLyricsAnalysisRequest {
  if (!isRecord(value) || !Array.isArray(value.songs)) {
    throw new Error("dataset and songs are required");
  }
  if (value.songs.length === 0 || value.songs.length > MAX_SONGS) {
    throw new Error(`songs must contain between 1 and ${MAX_SONGS} entries`);
  }

  return {
    dataset: parseDataset(value.dataset),
    songs: value.songs.map(parseSong),
    options: isRecord(value.options)
      ? {
          max_term_occurrences_per_song: typeof value.options.max_term_occurrences_per_song === "number"
            ? value.options.max_term_occurrences_per_song
            : undefined,
          min_love_documents: typeof value.options.min_love_documents === "number"
            ? value.options.min_love_documents
            : undefined,
          min_document_coverage: typeof value.options.min_document_coverage === "number"
            ? value.options.min_document_coverage
            : undefined,
          palette_size: typeof value.options.palette_size === "number"
            ? value.options.palette_size
            : undefined,
          love_seed_terms: Array.isArray(value.options.love_seed_terms)
            ? value.options.love_seed_terms.filter((term): term is string => typeof term === "string")
            : undefined,
          excluded_terms: Array.isArray(value.options.excluded_terms)
            ? value.options.excluded_terms.filter((term): term is string => typeof term === "string")
            : undefined,
        }
      : undefined,
  };
}

async function analyzeLyricsHandler(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const analysisRequest = parseRequest(body);
    const result = analyzeLoveLyrics(analysisRequest);

    return NextResponse.json({
      ...result,
      generated_at: new Date().toISOString(),
      data_retention: "none",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid lyrics analysis request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, analyzeLyricsHandler, { maxRequests: 5, windowMs: 60 * 1000 });
}
