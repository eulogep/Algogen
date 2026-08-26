import { useState } from "react";

export function useAnalyzeStream() {
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(userProfile: unknown, platformName: string) {
    setIsLoading(true);
    setResponse("");
    setError(null);

    try {
      const res = await fetch("/api/analyze/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userProfile, platform: platformName }),
      });

      if (!res.ok) {
        throw new Error(`Erreur serveur: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        setResponse((prev) => prev + text);
      }
    } catch (err: unknown) {
      console.error("Stream failed", err);
      setError(err instanceof Error ? err.message : "Impossible de joindre le flux");
    } finally {
      setIsLoading(false);
    }
  }

  return { response, isLoading, error, analyze };
}
