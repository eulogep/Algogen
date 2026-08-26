import { detectTrendObservations, getFreshSignals } from "./trend-engine";
import type { ObservatoryRun, SocialSignal, TrendProvider } from "./types";

/**
 * Exécute chaque fournisseur de manière isolée. Une API sociale indisponible
 * ne doit jamais masquer les observations issues des autres sources.
 */
export async function runObservatory(
  providers: TrendProvider[],
  now = new Date()
): Promise<ObservatoryRun> {
  const controller = new AbortController();
  const results = await Promise.allSettled(
    providers.map(async (provider) => ({
      provider: provider.id,
      signals: await provider.fetchSignals({ now, signal: controller.signal }),
    }))
  );

  const signals: SocialSignal[] = [];
  const providerResults = results.map((result, index) => {
    const provider = providers[index].id;
    if (result.status === "fulfilled") {
      signals.push(...result.value.signals);
      return { provider, signals: result.value.signals.length };
    }

    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
    console.error(`[observatory] ${provider} failed:`, reason);
    return { provider, signals: 0, error: reason };
  });

  const freshSignals = getFreshSignals(signals, now);
  return {
    signals: freshSignals,
    observations: detectTrendObservations(freshSignals, now),
    providerResults,
  };
}
