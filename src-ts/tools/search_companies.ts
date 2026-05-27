/**
 * Tool A: search_companies
 * 北海道の建設業企業を地域・工事カテゴリで検索する
 */

import { SupabaseClient } from "@supabase/supabase-js";

export const searchCompaniesToolDefinition = {
  name: "search_companies",
  description:
    "北海道の建設業企業を地域・工事カテゴリで検索します。" +
    "地域名（市町村名）または工事カテゴリslugのどちらかは必須です。" +
    "例：旭川市の舗装工事会社を最大10社返します。",
  inputSchema: {
    type: "object" as const,
    properties: {
      area: {
        type: "string",
        description: "市町村名（例：旭川市、札幌市、帯広市）。部分一致で検索します。",
      },
      work_category: {
        type: "string",
        description:
          "工事カテゴリのslug（例：paving=舗装工事、general-civil=土木一般）。",
      },
      limit: {
        type: "number",
        description: "返す件数の上限（デフォルト10、最大50）",
      },
    },
    required: [],
  },
};

interface SearchCompaniesArgs {
  area?: string;
  work_category?: string;
  limit?: number;
}

export async function handleSearchCompanies(
  args: SearchCompaniesArgs,
  supabase: SupabaseClient
): Promise<string> {
  const { area, work_category, limit = 10 } = args;

  if (!area && !work_category) {
    return JSON.stringify({
      error: {
        code: "MISSING_PARAMS",
        message: "地域名（area）または工事カテゴリ（work_category）のどちらかは必須です。",
        example: "例：area='旭川市' または work_category='paving'",
      },
    });
  }

  const actualLimit = Math.min(limit, 50);

  try {
    let query = supabase
      .from("companies")
      .select("id, company_name, address, work_type_ids")
      .eq("is_active", true)
      .limit(actualLimit);

    if (area) {
      query = query.ilike("address", `%${area}%`);
    }

    if (work_category) {
      query = query.contains("work_type_ids", [work_category]);
    }

    const { data, error } = await query;

    if (error) {
      return JSON.stringify({
        error: {
          code: "DB_ERROR",
          message: "データベース検索中にエラーが発生しました。",
          detail: error.message,
        },
      });
    }

    if (!data || data.length === 0) {
      return JSON.stringify({
        total_count: 0,
        returned_count: 0,
        companies: [],
        message: "条件に一致する企業が見つかりませんでした。",
        suggestion: "検索条件を変えてお試しください。",
        more_results_url: buildSearchUrl(area, work_category),
        _meta: { powered_by: "Tsukuras", website: "https://tsukuras.jp" },
      });
    }

    const companies = data.map((company) => ({
      name: company.company_name,
      address: company.address || "住所未登録",
      work_types: company.work_type_ids || [],
      detail_url: `https://tsukuras.jp/companies/${company.id}?utm_source=mcp`,
    }));

    return JSON.stringify(
      {
        total_count: data.length,
        returned_count: companies.length,
        companies,
        more_results_url: buildSearchUrl(area, work_category),
        _meta: {
          powered_by: "Tsukuras",
          website: "https://tsukuras.jp",
          note: "全件を見るには more_results_url を参照してください。",
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

function buildSearchUrl(area?: string, workCategory?: string): string {
  const params = new URLSearchParams();
  if (area) params.set("area", area);
  if (workCategory) params.set("work", workCategory);
  params.set("utm_source", "mcp");
  return `https://tsukuras.jp/search?${params.toString()}`;
}
