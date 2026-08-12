"use client";

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  TooltipItem,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface HistoryEntry {
  timestamp: string;
  l1HitRate: number;
  l2HitRate: number;
  missRate: number;
  totalRequests: number;
}

interface CurrentStats {
  l1Hits: number;
  l2Hits: number;
  misses: number;
  totalRequests: number;
  l1HitRate: number;
  l2HitRate: number;
}

interface PlatformAnalytics {
  count: number;
  successRate: number;
  avgResponseTimeMs: number;
}

const PLATFORM_NAMES: Record<string, string> = {
  tiktok: "TikTok",
  instagram_reels: "Instagram Reels",
  instagram_feed: "Instagram Feed",
  youtube_shorts: "YouTube Shorts",
  youtube_longform: "YouTube Long",
  linkedin: "LinkedIn",
  x_twitter: "X",
};

const STYLE = {
  fontInter: { fontFamily: "'Inter', sans-serif" },
  fontMono: { fontFamily: "'JetBrains Mono', monospace" }
};

export default function RefinedAnalyticsDashboard() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentStats, setCurrentStats] = useState<CurrentStats | null>(null);
  const [savingsText, setSavingsText] = useState<string>("$0.00");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [platformStats, setPlatformStats] = useState<Record<string, PlatformAnalytics>>({});
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/cache/history");
      if (!res.ok) throw new Error("Impossible de récupérer l’historique.");
      const data = await res.json() as { history?: HistoryEntry[] };
      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch (error: unknown) {
      console.warn("Cache history unavailable:", error);
      setHistory([]);
    }
  };

  const fetchCurrent = async () => {
    try {
      const res = await fetch("/api/cache/stats");
      if (!res.ok) throw new Error("Impossible de récupérer les statistiques.");
      const data = await res.json() as {
        stats?: CurrentStats;
        estimatedSavings?: string;
      };
      setCurrentStats(data.stats ?? {
        l1Hits: 0,
        l2Hits: 0,
        misses: 0,
        totalRequests: 0,
        l1HitRate: 0,
        l2HitRate: 0,
      });
      setSavingsText(data.estimatedSavings ?? "$0.00");
    } catch (error: unknown) {
      console.warn("Cache stats unavailable:", error);
      setCurrentStats({
        l1Hits: 0,
        l2Hits: 0,
        misses: 0,
        totalRequests: 0,
        l1HitRate: 0,
        l2HitRate: 0,
      });
      setSavingsText("$0.00");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Impossible de récupérer les métriques par plateforme.");
      const data = await res.json() as {
        snapshot?: { byPlatform?: Record<string, PlatformAnalytics> };
      };
      setPlatformStats(data.snapshot?.byPlatform ?? {});
    } catch (error: unknown) {
      console.warn("Platform analytics unavailable:", error);
      setPlatformStats({});
    }
  };

  useEffect(() => {
    const refreshDashboard = () => {
      void fetchHistory();
      void fetchCurrent();
      void fetchPlatformStats();
    };

    const initialRefresh = window.setTimeout(refreshDashboard, 0);
    const interval = window.setInterval(refreshDashboard, 30000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, []);

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const downloadCSV = () => {
    const headers = ["Timestamp", "Total Requests", "L1 Hit Rate (%)", "L2 Hit Rate (%)", "Miss Rate (%)"];
    const rows = history.map(h => [h.timestamp, h.totalRequests, h.l1HitRate, h.l2HitRate, h.missRate]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `algolens-cache-stats-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const currentMissRate = currentStats ? Math.round((currentStats.misses / currentStats.totalRequests) * 100) || 0 : 0;
  const labels = history.map(h => formatTime(h.timestamp));

  const lineChartData = {
    labels,
    datasets: [
      {
        data: history.map(h => h.l1HitRate),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.04)',
        tension: 0.4,
        fill: 'origin',
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
      },
      {
        data: history.map(h => h.l2HitRate),
        borderColor: '#818cf8',
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
      },
      {
        data: history.map(h => h.missRate),
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderDash: [3, 5],
        tension: 0.4,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1,
      }
    ]
  };

  const lineChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
        borderColor: '#27272a',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          afterBody: function(context: TooltipItem<"line">[]) {
            if (context.length > 0) {
               const idx = context[0].dataIndex;
               return `Total: ${history[idx].totalRequests}`;
            }
          }
        }
      }
    },
    scales: {
      x: { 
        grid: { color: '#111' },
        border: { display: false },
        ticks: { color: '#27272a', font: { family: "'JetBrains Mono', monospace", size: 10 }, maxTicksLimit: 7 } 
      },
      y: { 
        min: 0, 
        max: 100, 
        grid: { color: '#111' },
        border: { display: false },
        ticks: { color: '#27272a', font: { family: "'JetBrains Mono', monospace", size: 10 }, stepSize: 25, callback: (v: string | number) => `${v}%` }
      }
    }
  };

  const tableHistory = history.slice(-6).reverse();

  const hasHistory = history.length > 0;
  const platformRows = Object.entries(platformStats)
    .sort(([, left], [, right]) => right.count - left.count)
    .map(([platform, stats]) => ({
      name: PLATFORM_NAMES[platform] ?? platform,
      ...stats,
    }));
  const maxPlatformRequests = Math.max(...platformRows.map((row) => row.count), 1);

  const getTrend = (current: number, past: number | undefined) => {
    if (past === undefined || past === null) return { icon: "→", color: "#3f3f46", diff: 0 };
    const diff = current - past;
    if (diff > 1) return { icon: "↑", color: "#22c55e", diff };
    if (diff < -1) return { icon: "↓", color: "#ef4444", diff };
    return { icon: "→", color: "#3f3f46", diff };
  };

  const pastRecord = history.length > 2 ? history[history.length - 3] : null;
  const l1Trend = getTrend(currentStats?.l1HitRate || 0, pastRecord?.l1HitRate);
  const l2Trend = getTrend(currentStats?.l2HitRate || 0, pastRecord?.l2HitRate);
  const missTrend = getTrend(currentMissRate, pastRecord?.missRate);

  if (isLoading && !currentStats) {
    return <div className="h-screen w-full bg-[#09090b]" />;
  }

  return (
    <div style={{ backgroundColor: '#09090b', color: '#a1a1aa', fontSize: '13px', ...STYLE.fontInter }} className="h-full w-full flex flex-col">
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full bg-[#09090b]">
        
        <div className="p-[20px_24px_16px] border-b border-[#18181b] flex justify-between items-center">
          <div>
            <h1 className="text-[14px] font-medium text-[#fafafa] tracking-tight">Cache analytics</h1>
            <p style={STYLE.fontMono} className="text-[11px] text-[#3f3f46] mt-1">dernières 24h · données observées uniquement</p>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#18181b]">
          
          <div className="p-[16px_20px] border-r border-[#18181b] flex flex-col justify-between">
            <div>
               <div style={STYLE.fontMono} className="text-[10px] font-medium text-[#3f3f46] uppercase tracking-[.06em] mb-[10px]">L1 RAM</div>
               <div className="flex items-baseline">
                 <span className="text-[26px] font-light text-[#fafafa] tracking-[-.04em]">{currentStats?.l1HitRate}</span>
                 <span className="text-[13px] text-[#3f3f46] ml-[1px]">%</span>
               </div>
            </div>
            <div>
               <div style={{...STYLE.fontMono, color: l1Trend.color}} className="text-[10.5px] mb-[10px] mt-1">
                 {l1Trend.icon} {l1Trend.diff > 0 && '+'}{l1Trend.diff}% vs 1h
               </div>
               <div className="w-full h-[2px] bg-[#18181b] rounded-[1px] overflow-hidden">
                 <div className="h-full bg-[#22c55e]" style={{ width: `${currentStats?.l1HitRate ?? 0}%` }} />
               </div>
            </div>
          </div>

          <div className="p-[16px_20px] border-r border-[#18181b] flex flex-col justify-between">
            <div>
               <div style={STYLE.fontMono} className="text-[10px] font-medium text-[#3f3f46] uppercase tracking-[.06em] mb-[10px]">L2 Supabase</div>
               <div className="flex items-baseline">
                 <span className="text-[26px] font-light text-[#fafafa] tracking-[-.04em]">{currentStats?.l2HitRate}</span>
                 <span className="text-[13px] text-[#3f3f46] ml-[1px]">%</span>
               </div>
            </div>
            <div>
               <div style={{...STYLE.fontMono, color: l2Trend.color}} className="text-[10.5px] mb-[10px] mt-1">
                 {l2Trend.icon} {l2Trend.diff > 0 && '+'}{l2Trend.diff}% vs 1h
               </div>
               <div className="w-full h-[2px] bg-[#18181b] rounded-[1px] overflow-hidden">
                 <div className="h-full bg-[#818cf8]" style={{ width: `${currentStats?.l2HitRate ?? 0}%` }} />
               </div>
            </div>
          </div>

          <div className="p-[16px_20px] border-r border-[#18181b] flex flex-col justify-between">
            <div>
               <div style={STYLE.fontMono} className="text-[10px] font-medium text-[#3f3f46] uppercase tracking-[.06em] mb-[10px]">API Misses</div>
               <div className="flex items-baseline">
                 <span className="text-[26px] font-light text-[#fafafa] tracking-[-.04em]">{currentMissRate}</span>
                 <span className="text-[13px] text-[#3f3f46] ml-[1px]">%</span>
               </div>
            </div>
            <div>
               <div style={{...STYLE.fontMono, color: missTrend.color}} className="text-[10.5px] mb-[10px] mt-1">
                 {missTrend.icon} {missTrend.diff > 0 && '+'}{missTrend.diff}% vs 1h
               </div>
               <div className="w-full h-[2px] bg-[#18181b] rounded-[1px] overflow-hidden">
                 <div className="h-full bg-[#ef4444]" style={{ width: `${currentMissRate}%` }} />
               </div>
            </div>
          </div>

          <div className="p-[16px_20px] flex flex-col justify-between">
            <div>
               <div style={STYLE.fontMono} className="text-[10px] font-medium text-[#3f3f46] uppercase tracking-[.06em] mb-[10px]">Économies</div>
               <div className="flex items-baseline">
                 <span className="text-[26px] font-light text-[#fafafa] tracking-[-.04em]">{savingsText.split(" ")[0]}</span>
                 <span className="text-[13px] text-[#3f3f46] ml-[1px]">/j</span>
               </div>
            </div>
            <div>
               <div style={{...STYLE.fontMono, color: "#22c55e"}} className="text-[10.5px] mb-[10px] mt-1">
                 {currentStats?.totalRequests ? `${currentStats.totalRequests} requêtes observées` : "Aucune requête observée"}
               </div>
               <div className="w-full h-[2px] bg-[#18181b] rounded-[1px] overflow-hidden">
                 <div className="h-full bg-[#f59e0b]" style={{ width: `${Math.min(100, (currentStats?.totalRequests ?? 0) / 10)}%` }} />
               </div>
            </div>
          </div>
        </div>

        {/* CHART SECTION */}
        <div className="p-[20px_24px] border-b border-[#18181b]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[11px] font-medium text-[#52525b]">Taux de hit · 24h</span>
            <div style={STYLE.fontMono} className="flex space-x-3 text-[10.5px] text-[#3f3f46]">
              <div className="flex items-center space-x-1.5">
                <div className="w-[10px] h-[2px] bg-[#22c55e]"></div>
                <span>L1 RAM</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-[10px] h-[2px] bg-[#818cf8]"></div>
                <span>L2 DB</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-[10px] h-[2px]" style={{ backgroundImage: "repeating-linear-gradient(90deg, #ef4444, #ef4444 3px, transparent 3px, transparent 5px)"}}></div>
                <span>Misses</span>
              </div>
            </div>
          </div>
          <div className="h-[140px] w-full">
            {hasHistory ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-[#27272a] rounded-[8px] text-[11px] text-[#52525b]" style={STYLE.fontMono}>
                Aucun snapshot réel n’est encore disponible.
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM PANELS */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Snapshots Table */}
          <div className="flex-1 border-r border-[#18181b] p-[16px_20px] flex flex-col overflow-y-auto scrollbar-hide">
             <div style={STYLE.fontMono} className="text-[10px] font-medium text-[#3f3f46] uppercase tracking-[.07em] mb-4">
                SNAPSHOTS RÉCENTS
             </div>
             <div className="flex flex-col">
               {tableHistory.length === 0 ? (
                 <p className="text-[11px] text-[#52525b]" style={STYLE.fontMono}>Aucun snapshot réel disponible.</p>
               ) : tableHistory.map((row, idx) => {
                  const prevL1 = tableHistory[idx + 1]?.l1HitRate;
                  let tIcon = "→"; let tColor = "#3f3f46";
                  if (prevL1) {
                     const diff = row.l1HitRate - prevL1;
                     if (diff > 1) { tIcon = "↑"; tColor = "#22c55e"; }
                     else if (diff < -1) { tIcon = "↓"; tColor = "#ef4444"; }
                  }
                  
                  return (
                    <div key={idx} className="flex items-center py-[9px] border-b border-[#111] last:border-0" style={STYLE.fontMono}>
                      <span className="w-[38px] text-[10.5px] text-[#3f3f46]">{formatTime(row.timestamp)}</span>
                      <span className="w-[30px] text-[11px] text-[#22c55e] ml-1">{row.l1HitRate}%</span>
                      <span className="w-[12px] text-[10px] text-center ml-2" style={{ color: tColor }}>{tIcon}</span>
                      <span className="ml-auto text-[10.5px] text-[#27272a]">{row.totalRequests} req</span>
                    </div>
                  );
               })}
             </div>
          </div>

          <div className="flex-1 p-[16px_20px] flex flex-col overflow-y-auto scrollbar-hide relative">
             <div style={STYLE.fontMono} className="text-[10px] font-medium text-[#3f3f46] uppercase tracking-[.07em] mb-4">
                HITS PAR PLATEFORME
             </div>
             <div className="flex flex-col space-y-3 pt-1">
               {platformRows.length === 0 ? (
                 <p className="text-[11px] text-[#52525b] leading-relaxed" style={STYLE.fontMono}>
                   Aucune analyse réelle observée sur cette instance au cours des dernières 24 heures.
                 </p>
               ) : platformRows.map((platform) => (
                 <div key={platform.name} className="flex items-center space-x-3">
                   <div className="w-[86px] text-[12px] text-[#71717a] truncate">{platform.name}</div>
                   <div className="flex-1 h-[2px] bg-[#18181b] rounded-[1px] overflow-hidden">
                     <div
                       className="h-full rounded-[1px] bg-[#38bdf8]"
                       style={{ width: `${(platform.count / maxPlatformRequests) * 100}%` }}
                     />
                   </div>
                   <div style={STYLE.fontMono} className="w-[32px] text-right text-[10.5px] text-[#3f3f46]">{platform.count}</div>
                 </div>
               ))}
             </div>

             {/* Export Button moved here */}
             <div className="mt-auto pt-6 flex justify-end">
               <button 
                 onClick={downloadCSV}
                 style={STYLE.fontMono}
                 className="text-[11px] text-[#52525b] border border-[#27272a] rounded-[6px] p-[5px_12px] bg-transparent hover:text-[#a1a1aa] hover:border-[#3f3f46] transition-colors"
               >
                 Export CSV
               </button>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
