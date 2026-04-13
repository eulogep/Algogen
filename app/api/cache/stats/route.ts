import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/cache';

export const dynamic = 'force-dynamic'; // Désactiver le cache Next.js statique pour cette route

export async function GET() {
  try {
    const stats = getCacheStats();
    
    // Estimation des économies générées par le cache (supposant ~0.01$ par requête Claude Sonnet)
    const totalHits = stats.l1Hits + stats.l2Hits;
    const estimatedSavings = parseFloat((totalHits * 0.01).toFixed(2));
    
    const interpretation = stats.totalRequests > 0 
      ? `${stats.l1HitRate}% des requêtes servies instantanément en RAM (<1ms). ${stats.l2HitRate}% des requêtes servies depuis Supabase L2 (~50ms).`
      : "Aucun trafic enregistré pour l'instant.";

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      stats,
      interpretation,
      estimatedSavings: `$${estimatedSavings} économisés`,
    });
  } catch (error) {
    console.error("Cache Stats Error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les statistiques du cache" },
      { status: 500 }
    );
  }
}
