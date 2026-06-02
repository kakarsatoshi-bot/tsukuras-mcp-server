/**
 * Tool B: get_area_stats
 * 市町村ごとの建設業統計サマリーを返す
 */

import { SupabaseClient } from "@supabase/supabase-js";

export const getAreaStatsToolDefinition = {
  name: "get_area_stats",
  description:
    "Get construction industry statistics for a specific municipality in Hokkaido, Japan. " +
    "Returns total company count, population, and a link to the Tsukuras area detail page.",
  inputSchema: {
    type: "object" as const,
    properties: {
      area: {
        type: "string",
        description: "Municipality name in Hokkaido (e.g. '旭川市', '札幌市', '帯広市')",
      },
    },
    required: ["area"],
  },
};

interface GetAreaStatsArgs {
  area: string;
}

export async function handleGetAreaStats(
  args: GetAreaStatsArgs,
  supabase: SupabaseClient
): Promise<string> {
  const { area } = args;

  if (!area || area.trim() === "") {
    return JSON.stringify({
      error: { code: "MISSING_AREA", message: "市町村名（area）は必須です。" },
    });
  }

  try {
    // areasテーブルから地域情報を取得（is_activeフィルタは使用しない）
    const { data: areaData, error: areaError } = await supabase
      .from("areas")
      .select("id, city, prefecture, population, slug")
      .ilike("city", `%${area}%`)
      .limit(1)
      .single();

    if (areaError || !areaData) {
      return JSON.stringify({
        error: {
          code: "AREA_NOT_FOUND",
          message: `「${area}」という地域が見つかりませんでした。`,
          suggestion: "正式な市町村名（例：旭川市）でお試しください。",
        },
      });
    }

    // companiesテーブルはstatusカラムを使用
    const { count: totalCompanies } = await supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("status", "基本情報")
      .or(`address.ilike.%${areaData.city}%,city.ilike.%${areaData.city}%`);

    return JSON.stringify(
      {
        area_name: areaData.city,
        prefecture: areaData.prefecture || "北海道",
        population: areaData.population || null,
        total_companies: totalCompanies || 0,
        detail_url: `https://tsukuras.jp/areas/${areaData.slug}?utm_source=mcp`,
        _meta: {
          powered_by: "Tsukuras",
          website: "https://tsukuras.jp",
          note: "詳細な企業一覧はdetail_urlをご参照ください。",
        },
      },
      null,
      2
    );
  } catch (err) {
    return JSON.stringify({
      error: { code: "UNEXPECTED_ERROR", message: "予期しないエラーが発生しました。", detail: String(err) },
    });
  }
}
