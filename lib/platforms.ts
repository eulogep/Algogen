import type { PlatformMeta, PlatformId } from "./types";

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "tiktok",
    label: "TikTok",
    shortDescription: "FYP Algorithm · Viral short-form video",
    color: "#00f2ea",
    gradient: "from-[#010101] via-[#69C9D0] to-[#EE1D52]",
    icon: "🎵",
  },
  {
    id: "instagram_reels",
    label: "Instagram Reels",
    shortDescription: "Reels Algorithm · Discovery & vertical video",
    color: "#E1306C",
    gradient: "from-[#833ab4] via-[#fd1d1d] to-[#fcb045]",
    icon: "🎬",
  },
  {
    id: "instagram_feed",
    label: "Instagram Feed",
    shortDescription: "Feed Algorithm · Photos & Carousels",
    color: "#fcb045",
    gradient: "from-[#405DE6] via-[#833AB4] to-[#FD1D1D]",
    icon: "📸",
  },
  {
    id: "youtube_shorts",
    label: "YouTube Shorts",
    shortDescription: "Shorts Algorithm · Vertical video discovery",
    color: "#FF0000",
    gradient: "from-[#FF0000] to-[#cc0000]",
    icon: "⚡",
  },
  {
    id: "youtube_longform",
    label: "YouTube Longform",
    shortDescription: "Recommendation & Search · Long-form video",
    color: "#FF0000",
    gradient: "from-[#282828] to-[#FF0000]",
    icon: "▶️",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    shortDescription: "Feed Relevance Algorithm · B2B & professional",
    color: "#0A66C2",
    gradient: "from-[#0A66C2] to-[#004182]",
    icon: "💼",
  },
  {
    id: "x_twitter",
    label: "X / Twitter",
    shortDescription: "For You Algorithm · Real-time & text",
    color: "#1DA1F2",
    gradient: "from-[#14171A] to-[#657786]",
    icon: "𝕏",
  },
];

export const PLATFORM_MAP = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p])
) as Record<PlatformId, PlatformMeta>;
