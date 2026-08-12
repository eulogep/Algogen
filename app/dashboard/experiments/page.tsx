"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Workspace = {
  id: string;
  name: string;
  kind: "team" | "agency";
  created_at: string;
};

type Brand = {
  id: string;
  workspace_id: string;
  name: string;
  primary_platform: string | null;
  primary_objective: string | null;
  created_at: string;
};

type ExperimentStatus = "draft" | "planned" | "published" | "learning" | "completed";

type Experiment = {
  id: string;
  workspace_id: string;
  brand_id: string;
  platform: string;
  title: string;
  hypothesis: string;
  content_format: string | null;
  target_kpi: string;
  priority: number;
  status: ExperimentStatus;
  scheduled_for: string | null;
  published_at: string | null;
  baseline_metric: number | null;
  observed_metric: number | null;
  learnings: string | null;
  created_at: string;
};

type WorkspacePayload = {
  workspaces: Workspace[];
  brands: Brand[];
  experiments: Experiment[];
};

const PLATFORMS = [
  ["tiktok", "TikTok"],
  ["instagram_reels", "Instagram Reels"],
  ["instagram_feed", "Instagram Feed"],
  ["youtube_shorts", "YouTube Shorts"],
  ["youtube_longform", "YouTube Long"],
  ["linkedin", "LinkedIn"],
  ["x_twitter", "X"],
] as const;

const STATUS_LABELS: Record<ExperimentStatus, string> = {
  draft: "Brouillon",
  planned: "À publier",
  published: "Publié",
  learning: "À analyser",
  completed: "Appris",
};

const STATUS_COLORS: Record<ExperimentStatus, string> = {
  draft: "bg-zinc-800 text-zinc-300",
  planned: "bg-violet-500/15 text-violet-200",
  published: "bg-sky-500/15 text-sky-200",
  learning: "bg-amber-500/15 text-amber-200",
  completed: "bg-emerald-500/15 text-emerald-200",
};

const fieldClass = "mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500";

export default function ExperimentsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<WorkspacePayload>({ workspaces: [], brands: [], experiments: [] });
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceForm, setWorkspaceForm] = useState({
    workspaceName: "",
    brandName: "",
    kind: "team" as "team" | "agency",
    primaryPlatform: "instagram_reels",
    primaryObjective: "visibility",
  });
  const [experimentForm, setExperimentForm] = useState(() => ({
    brandId: "",
    title: searchParams.get("title") ?? "",
    hypothesis: searchParams.get("hypothesis") ?? "",
    platform: searchParams.get("platform") ?? "instagram_reels",
    contentFormat: "",
    targetKpi: searchParams.get("targetKpi") ?? "Portée",
    priority: "2",
    scheduledFor: "",
  }));

  const selectedWorkspace = data.workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  const workspaceBrands = useMemo(
    () => data.brands.filter((brand) => brand.workspace_id === selectedWorkspaceId),
    [data.brands, selectedWorkspaceId]
  );
  const workspaceExperiments = useMemo(
    () => data.experiments.filter((experiment) => experiment.workspace_id === selectedWorkspaceId),
    [data.experiments, selectedWorkspaceId]
  );

  const refresh = async () => {
    const response = await fetch("/api/workspace");
    const payload = await response.json() as WorkspacePayload & { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Impossible de charger le workspace.");

    setData(payload);
    setSelectedWorkspaceId((current) => current || payload.workspaces[0]?.id || "");
    setExperimentForm((current) => ({
      ...current,
      brandId: current.brandId || payload.brands[0]?.id || "",
    }));
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void refresh()
        .catch((refreshError: unknown) => setError(refreshError instanceof Error ? refreshError.message : "Erreur de chargement."))
        .finally(() => setIsLoading(false));
    }, 0);

    return () => window.clearTimeout(initialLoad);
  }, []);

  const createWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_workspace", ...workspaceForm }),
      });
      const payload = await response.json() as { workspaceId?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Impossible de créer l’espace.");

      await refresh();
      setSelectedWorkspaceId(payload.workspaceId ?? "");
      setWorkspaceForm((current) => ({ ...current, workspaceName: "", brandName: "" }));
      setNotice("Espace créé. Votre première marque est prête pour recevoir des tests.");
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Erreur de création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createExperiment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_experiment",
          workspaceId: selectedWorkspaceId,
          ...experimentForm,
          priority: Number(experimentForm.priority),
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Impossible de créer le test.");

      await refresh();
      setExperimentForm((current) => ({
        ...current,
        title: "",
        hypothesis: "",
        contentFormat: "",
        scheduledFor: "",
      }));
      setNotice("Test ajouté au backlog. Publiez-le, puis renseignez le résultat pour ancrer l’apprentissage.");
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Erreur de création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateExperimentStatus = async (experimentId: string, status: ExperimentStatus) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experimentId, status }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Impossible de mettre à jour le test.");
      await refresh();
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : "Erreur de mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-full bg-zinc-950 p-8 text-sm text-zinc-500">Chargement de votre espace de tests…</div>;
  }

  return (
    <div className="min-h-full bg-zinc-950 px-5 py-7 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-900 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-emerald-400">Boucle de performance</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Tests de contenu</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Transformez une recommandation en hypothèse, publication et apprentissage. Cet espace ne présente que les tests saisis par votre équipe.
            </p>
          </div>
          {data.workspaces.length > 0 && (
            <label className="text-xs text-zinc-400">
              Espace actif
              <select
                value={selectedWorkspaceId}
                onChange={(event) => {
                  const workspaceId = event.target.value;
                  setSelectedWorkspaceId(workspaceId);
                  const firstBrand = data.brands.find((brand) => brand.workspace_id === workspaceId);
                  setExperimentForm((current) => ({ ...current, brandId: firstBrand?.id ?? "" }));
                }}
                className="mt-1 block min-w-52 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
              >
                {data.workspaces.map((workspace) => (
                  <option value={workspace.id} key={workspace.id}>{workspace.name} · {workspace.kind === "agency" ? "Agence" : "Équipe"}</option>
                ))}
              </select>
            </label>
          )}
        </header>

        {error && <div className="mb-5 rounded-lg border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>}
        {notice && <div className="mb-5 rounded-lg border border-emerald-900/70 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

        {data.workspaces.length === 0 ? (
          <section className="max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white">Créez le premier espace de votre équipe</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Un espace regroupe vos marques, vos hypothèses et les résultats. Commencez avec une marque et une plateforme prioritaire.
            </p>
            <form onSubmit={createWorkspace} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-zinc-300">Nom de l’espace
                <input required minLength={2} value={workspaceForm.workspaceName} onChange={(event) => setWorkspaceForm({ ...workspaceForm, workspaceName: event.target.value })} className={fieldClass} placeholder="Studio Acme" />
              </label>
              <label className="text-sm text-zinc-300">Type
                <select value={workspaceForm.kind} onChange={(event) => setWorkspaceForm({ ...workspaceForm, kind: event.target.value as "team" | "agency" })} className={fieldClass}>
                  <option value="team">Équipe interne</option>
                  <option value="agency">Agence</option>
                </select>
              </label>
              <label className="text-sm text-zinc-300">Première marque
                <input required minLength={2} value={workspaceForm.brandName} onChange={(event) => setWorkspaceForm({ ...workspaceForm, brandName: event.target.value })} className={fieldClass} placeholder="Acme France" />
              </label>
              <label className="text-sm text-zinc-300">Plateforme prioritaire
                <select value={workspaceForm.primaryPlatform} onChange={(event) => setWorkspaceForm({ ...workspaceForm, primaryPlatform: event.target.value })} className={fieldClass}>
                  {PLATFORMS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
              <label className="text-sm text-zinc-300 sm:col-span-2">Objectif principal
                <select value={workspaceForm.primaryObjective} onChange={(event) => setWorkspaceForm({ ...workspaceForm, primaryObjective: event.target.value })} className={fieldClass}>
                  <option value="visibility">Visibilité / portée</option>
                  <option value="engagement">Engagement</option>
                  <option value="subscribers">Abonnés</option>
                  <option value="sales">Ventes</option>
                </select>
              </label>
              <button disabled={isSubmitting} className="sm:col-span-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Création…" : "Créer l’espace et commencer"}
              </button>
            </form>
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.3fr)]">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{selectedWorkspace?.kind === "agency" ? "Portefeuille agence" : "Marque active"}</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">{selectedWorkspace?.name}</h2>
                </div>
                <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{workspaceBrands.length} marque{workspaceBrands.length > 1 ? "s" : ""}</span>
              </div>

              <form onSubmit={createExperiment} className="mt-6 grid gap-4">
                <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 text-sm text-emerald-100">
                  <p className="font-medium">Nouvelle hypothèse à tester</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-200/70">Une bonne hypothèse relie un format à un signal et à un KPI observable.</p>
                </div>
                <label className="text-sm text-zinc-300">Marque
                  <select required value={experimentForm.brandId} onChange={(event) => setExperimentForm({ ...experimentForm, brandId: event.target.value })} className={fieldClass}>
                    {workspaceBrands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
                  </select>
                </label>
                <label className="text-sm text-zinc-300">Titre du test
                  <input required minLength={3} value={experimentForm.title} onChange={(event) => setExperimentForm({ ...experimentForm, title: event.target.value })} className={fieldClass} placeholder="Hook question dans les deux premières secondes" />
                </label>
                <label className="text-sm text-zinc-300">Hypothèse
                  <textarea required minLength={8} rows={4} value={experimentForm.hypothesis} onChange={(event) => setExperimentForm({ ...experimentForm, hypothesis: event.target.value })} className={fieldClass} placeholder="Si nous ouvrons le Reel avec une question précise, la rétention à 3 secondes devrait dépasser le baseline." />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-zinc-300">Plateforme
                    <select value={experimentForm.platform} onChange={(event) => setExperimentForm({ ...experimentForm, platform: event.target.value })} className={fieldClass}>
                      {PLATFORMS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-zinc-300">KPI cible
                    <input value={experimentForm.targetKpi} onChange={(event) => setExperimentForm({ ...experimentForm, targetKpi: event.target.value })} className={fieldClass} placeholder="Rétention à 3 s" />
                  </label>
                  <label className="text-sm text-zinc-300">Format
                    <input value={experimentForm.contentFormat} onChange={(event) => setExperimentForm({ ...experimentForm, contentFormat: event.target.value })} className={fieldClass} placeholder="Reel 20 s" />
                  </label>
                  <label className="text-sm text-zinc-300">Priorité
                    <select value={experimentForm.priority} onChange={(event) => setExperimentForm({ ...experimentForm, priority: event.target.value })} className={fieldClass}>
                      <option value="1">P1 — essentielle</option>
                      <option value="2">P2 — importante</option>
                      <option value="3">P3 — à planifier</option>
                    </select>
                  </label>
                </div>
                <label className="text-sm text-zinc-300">Date de publication prévue <span className="text-zinc-600">(facultatif)</span>
                  <input type="date" value={experimentForm.scheduledFor} onChange={(event) => setExperimentForm({ ...experimentForm, scheduledFor: event.target.value })} className={fieldClass} />
                </label>
                <button disabled={isSubmitting || workspaceBrands.length === 0} className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? "Enregistrement…" : "Ajouter au backlog"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Apprentissage mesurable</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Backlog d’expériences</h2>
                </div>
                <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{workspaceExperiments.length} test{workspaceExperiments.length > 1 ? "s" : ""}</span>
              </div>

              <div className="mt-5 space-y-3">
                {workspaceExperiments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 px-5 py-12 text-center text-sm text-zinc-500">
                    Ajoutez le premier test. Il deviendra le point de départ de la boucle « hypothèse → publication → apprentissage ».
                  </div>
                ) : workspaceExperiments.map((experiment) => (
                  <article key={experiment.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300">P{experiment.priority}</span>
                      <span className={`rounded-md px-2 py-1 text-xs ${STATUS_COLORS[experiment.status]}`}>{STATUS_LABELS[experiment.status]}</span>
                      <span className="ml-auto text-xs text-zinc-500">{PLATFORMS.find(([value]) => value === experiment.platform)?.[1] ?? experiment.platform}</span>
                    </div>
                    <h3 className="mt-3 font-medium text-white">{experiment.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{experiment.hypothesis}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>KPI : {experiment.target_kpi}</span>
                      {experiment.content_format && <span>Format : {experiment.content_format}</span>}
                      {experiment.scheduled_for && <span>Prévu : {new Date(`${experiment.scheduled_for}T00:00:00`).toLocaleDateString("fr-FR")}</span>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {experiment.status === "planned" && <button disabled={isSubmitting} onClick={() => updateExperimentStatus(experiment.id, "published")} className="rounded-md border border-sky-800 bg-sky-950/40 px-2.5 py-1.5 text-xs text-sky-200 hover:bg-sky-900/50 disabled:opacity-60">Marquer publié</button>}
                      {experiment.status === "published" && <button disabled={isSubmitting} onClick={() => updateExperimentStatus(experiment.id, "learning")} className="rounded-md border border-amber-800 bg-amber-950/40 px-2.5 py-1.5 text-xs text-amber-200 hover:bg-amber-900/50 disabled:opacity-60">Passer à l’analyse</button>}
                      {experiment.status === "learning" && <button disabled={isSubmitting} onClick={() => updateExperimentStatus(experiment.id, "completed")} className="rounded-md border border-emerald-800 bg-emerald-950/40 px-2.5 py-1.5 text-xs text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-60">Valider l’apprentissage</button>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
