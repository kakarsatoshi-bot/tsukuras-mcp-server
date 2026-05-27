/**
 * Tool C: get_work_category
 * 工事カテゴリの説明・該当企業数・地域分布を返す
 */

import { SupabaseClient } from "@supabase/supabase-js";

export const getWorkCategoryToolDefinition = {
  name: "get_work_category",
  description:
    "北海道建設業の工事カテゴリ情報を取得します。" +
    "工事の説明、対応企業数、Tsukurasの詳細ページへのリンクを返します。" +
    "slugまたは日本語の工事名で検索できます。" +
    "例：paving（舗装工事）、general-civil（土木一般）、building（建築工事）",
  inputSchema: {
    type: "object" as const,
    properties: {
      work_category: {
        type: "string",
        description:
          "工事カテゴリのslugまたは日本語名。" +
          "例：paving / 舗装工事、general-civil / 土木一般、building / 建築工事",
      },
    },
    required: ["work_category"],
  },
};

interface GetWorkCategoryArgs {
  work_category: string;
}

export async function handleGetWorkCategory(
  args: GetWorkCategoryArgs,
  supabase: SupabaseClient
): Promise<string> {
  const { work_category } = args;

  if (!work_category || work_category.trim() === "") {
    return JSON.stringify({
      error: {
        code: "MISSING_WORK_CATEGORY",
        message: "工事カテゴリ名（work_category）は必須です。",
        example: "例：work_category='paving' または work_category='舗装工事'",
      },
    });
  }

  try {
    // slugまたは名前で検索（複数ヒット対応のため .limit(1) + data[0] を使用）
    const { data: works, error: workError } = await supabase
      .from("works")
      .select("id, slug, name, description")
      .eq("is_active", true)
      .or(`slug.eq.${work_category},name.ilike.%${work_category}%`)
      .limit(1);

    const workData = works?.[0];

    if (workError || !workData) {
      // 見つからない場合は全カテゴリ一覧を返す
      const { data: allWorks } = await supabase
        .from("works")
        .select("slug, name")
        .eq("is_active", true)
        .order("slug");

      return JSON.stringify({
        error: {
          code: "WORK_CATEGORY_NOT_FOUND",
          message: `「${work_category}」という工事カテゴリが見つかりませんでした。`,
          available_categories: allWorks?.map((w) => ({
            slug: w.slug,
            name: w.name,
          })) || [],
          suggestion: "上記のslugまたは日本語名で再度お試しください。",
        },
      });
    }

    // 該当工事カテゴリの企業数を取得
    const { count: totalCompanies } = await supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("status", "基本情報")
      .contains("work_type_ids", [workData.slug]);

    return JSON.stringify(
      {
        slug: workData.slug,
        name: workData.name,
        description: workData.description || "説明文は準備中です。",
        total_companies: totalCompanies || 0,
        detail_url: `https://tsukuras.jp/works/${workData.slug}?utm_source=mcp`,
        search_url: `https://tsukuras.jp/search?work=${workData.slug}&utm_source=mcp`,
        _meta: {
          powered_by: "Tsukuras",
          website: "https://tsukuras.jp",
          note: `${workData.name}に対応する企業一覧はsearch_urlをご参照ください。`,
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
