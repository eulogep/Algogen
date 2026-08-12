import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type WorkspaceKind = "team" | "agency";
type ExperimentStatus = "draft" | "planned" | "published" | "learning" | "completed";

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: workspaces, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, kind, created_at")
    .order("created_at", { ascending: true });

  if (workspaceError) {
    console.error("Unable to fetch workspaces:", workspaceError);
    return NextResponse.json({ error: "Impossible de charger les espaces." }, { status: 500 });
  }

  const workspaceIds = (workspaces ?? []).map((workspace) => workspace.id as string);
  if (workspaceIds.length === 0) {
    return NextResponse.json({ workspaces: [], brands: [], experiments: [] });
  }

  const [brandsResult, experimentsResult] = await Promise.all([
    supabase
      .from("brands")
      .select("id, workspace_id, name, primary_platform, primary_objective, created_at")
      .in("workspace_id", workspaceIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("content_experiments")
      .select("id, workspace_id, brand_id, platform, title, hypothesis, content_format, target_kpi, priority, status, scheduled_for, published_at, baseline_metric, observed_metric, learnings, created_at")
      .in("workspace_id", workspaceIds)
      .order("created_at", { ascending: false }),
  ]);

  if (brandsResult.error || experimentsResult.error) {
    console.error("Unable to fetch workspace content:", brandsResult.error ?? experimentsResult.error);
    return NextResponse.json({ error: "Impossible de charger les expériences." }, { status: 500 });
  }

  return NextResponse.json({
    workspaces: workspaces ?? [],
    brands: brandsResult.data ?? [],
    experiments: experimentsResult.data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json() as Record<string, unknown>;
  const action = text(body.action, 32);

  if (action === "create_workspace") {
    const workspaceName = text(body.workspaceName, 120);
    const brandName = text(body.brandName, 120);
    const kind = body.kind === "agency" ? "agency" : "team" as WorkspaceKind;
    const primaryPlatform = text(body.primaryPlatform, 64);
    const primaryObjective = text(body.primaryObjective, 64);

    if (workspaceName.length < 2 || brandName.length < 2) {
      return NextResponse.json(
        { error: "Indiquez un nom d’espace et de marque d’au moins deux caractères." },
        { status: 400 }
      );
    }

    const { data: workspaceId, error } = await supabase.rpc("create_workspace_with_brand", {
      p_workspace_name: workspaceName,
      p_workspace_kind: kind,
      p_brand_name: brandName,
      p_primary_platform: primaryPlatform,
      p_primary_objective: primaryObjective,
    });

    if (error) {
      console.error("Unable to create workspace:", error);
      return NextResponse.json({ error: "Impossible de créer cet espace." }, { status: 500 });
    }

    return NextResponse.json({ workspaceId }, { status: 201 });
  }

  if (action === "create_experiment") {
    const workspaceId = text(body.workspaceId, 64);
    const brandId = text(body.brandId, 64);
    const title = text(body.title, 180);
    const hypothesis = text(body.hypothesis, 1200);
    const platform = text(body.platform, 64);
    const contentFormat = text(body.contentFormat, 120);
    const targetKpi = text(body.targetKpi, 120) || "Portée";
    const scheduledFor = text(body.scheduledFor, 10) || null;
    const priorityValue = Number(body.priority);
    const priority = Number.isInteger(priorityValue) && priorityValue >= 1 && priorityValue <= 3
      ? priorityValue
      : 2;

    if (!workspaceId || !brandId || title.length < 3 || hypothesis.length < 8 || !platform) {
      return NextResponse.json(
        { error: "Renseignez la plateforme, le titre et une hypothèse d’au moins huit caractères." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("content_experiments")
      .insert({
        workspace_id: workspaceId,
        brand_id: brandId,
        created_by: user.id,
        platform,
        title,
        hypothesis,
        content_format: contentFormat || null,
        target_kpi: targetKpi,
        priority,
        status: "planned" as ExperimentStatus,
        scheduled_for: scheduledFor,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Unable to create experiment:", error);
      return NextResponse.json({ error: "Impossible de créer ce test." }, { status: 500 });
    }

    return NextResponse.json({ experimentId: data.id }, { status: 201 });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json() as Record<string, unknown>;
  const experimentId = text(body.experimentId, 64);
  const status = text(body.status, 32) as ExperimentStatus;
  const learnings = text(body.learnings, 1200);
  const observedMetric = body.observedMetric === "" || body.observedMetric === undefined
    ? null
    : Number(body.observedMetric);

  if (!experimentId || !["draft", "planned", "published", "learning", "completed"].includes(status)) {
    return NextResponse.json({ error: "Mise à jour invalide." }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    status,
    learnings: learnings || null,
  };

  if (Number.isFinite(observedMetric)) update.observed_metric = observedMetric;
  if (status === "published") update.published_at = new Date().toISOString();

  const { error } = await supabase
    .from("content_experiments")
    .update(update)
    .eq("id", experimentId);

  if (error) {
    console.error("Unable to update experiment:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour ce test." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
