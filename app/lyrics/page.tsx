import LyricsAnalyzerClient from "./LyricsAnalyzerClient";

export const metadata = {
  title: "Laboratoire lexical | AlgoLens",
  description: "Analyse de tendances de chansons d'amour à partir de comptes de mots agrégés.",
};

export default function LyricsPage() {
  return <LyricsAnalyzerClient />;
}
