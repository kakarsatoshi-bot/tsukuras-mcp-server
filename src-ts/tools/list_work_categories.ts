/**
 * Tool D: list_work_categories
 * 全工事カテゴリの一覧と各カテゴリの企業数を返す
 */

import { SupabaseClient } from "@supabase/supabase-js";

export const listWorkCategoriesToolDefinition = {
  name: "list_work_categories",
  description:
    "北海道建設業の工事カテゴリ一覧を取得します。" +
    "全16種類のカテゴリのslug・日本語名・対応企業数を一覧で返します。" +
    "「どんな工事カテゴリがある？」「工事の種類を教えて」といった質問に答えます。",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export async function handleListWorkCategories(
  supabase: SupabaseClient
): Promise<string> {
  try {
    const { data: works, error: worksError } = await supabase
      .from("works")
      .select("slug, name, description")
      .eq("is_active", true)
      .order("sort_order");

    if (worksError || !works) {
      return JSON.stringify({
        error: {
          code: "DB_ERROR",
          message: "工事カテゴリの取得中にエラーが発生しました。",
          detail: worksError?.message,
        },
      });
    }

    // 各カテゴリの企業数を並列取得
    const categoriesWithCount = await Promise.all(
      works.map(async (work) => {
        const { count } = await supabase
          .from("companies")
          .select("id", { count: "exact", head: true })
          .eq("status", "基本情報")
          .contains("work_type_ids", [work.slug]);

        return {
          slug: work.slug,
          name: work.name,
          company_count: count || 0,
          detail_url: `https://tsukuras.jp/works/${work.slug}?utm_source=mcp`,
        };
      })
    );

    // 企業数の多い順にソート
    const sorted = categoriesWithCount.sort(
      (a, b) => b.company_count - a.company_count
    );

    return JSON.stringify(
      {
        total_categories: sorted.length,
        categories: sorted,
        note: "各カテゴリの詳細はget_work_categoryツールで確認できます。",
        _meta: {
          powered_by: "Tsukuras",
          website: "https://tsukuras.jp",
          all_categories_url: "https://tsukuras.jp/works?utm_source=mcp",
        },
      },
      null,
      2
    );
  } catch (err) {
    return JSON.stringify({
      error: {
        code: "UNEXPECTED_ERROR",
        message: "予期しないエラーが発生しました。",
        detail: String(err),
      },
    });
  }
}
