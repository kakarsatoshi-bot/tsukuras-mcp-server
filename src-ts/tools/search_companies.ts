/**
 * Tool A: search_companies
 * 北海道の建設業企業を地域・工事カテゴリで検索する
 */

import { SupabaseClient } from "@supabase/supabase-js";

export const searchCompaniesToolDefinition = {
  name: "search_companies",
  description:
    "Search construction companies in Hokkaido, Japan by municipality and work category. " +
    "Returns company names, addresses, work types, and detail URLs. " +
    "At least one of area or work_category is required. " +
    "Example: find paving contractors in Asahikawa.",
  inputSchema: {
    type: "object" as const,
    properties: {
      area: {
        type: "string",
        description: "Municipality name in Hokkaido (e.g. '旭川市', '札幌市', '帯広市'). Supports partial match.",
      },
      work_category: {
        type: "string",
        description: "Work category slug (e.g. 'paving' for 舗装工事, 'general-civil' for 土木一般). Use list_work_categories to see all valid slugs.",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default 10, max 50)",
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
      .select("id, slug, company_name, address, work_type_ids, prefecture, city")
      .eq("status", "基本情報")
      .limit(actualLimit);

    if (area) {
      query = query.or(`address.ilike.%${area}%,city.ilike.%${area}%`);
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

    // detail_url は companies.slug で組む（サイト側が slug で企業ページを引くため）。
    // slug が空／NULL の行は 404 になるURLを返さず、キー自体を省く。
    let omittedDetailUrlCount = 0;

    const companies = data.map((company) => {
      const base = {
        name: company.company_name,
        address: company.address || `${company.prefecture || "北海道"}${company.city || ""}`,
        work_types: company.work_type_ids || [],
      };

      const slug = typeof company.slug === "string" ? company.slug.trim() : "";
      if (!slug) {
        omittedDetailUrlCount++;
        return base;
      }

      return {
        ...base,
        detail_url: `https://tsukuras.jp/companies/${encodeURIComponent(slug)}?utm_source=mcp`,
      };
    });

    return JSON.stringify(
      {
        total_count: data.length,
        returned_count: companies.length,
        companies,
        ...(omittedDetailUrlCount > 0
          ? { omitted_detail_url_count: omittedDetailUrlCount }
          : {}),
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
      error: {
        code: "UNEXPECTED_ERROR",
        message: "予期しないエラーが発生しました。",
        detail: String(err),
      },
    });
  }
}

/**
 * more_results_url を実在するページに向ける。
 * tsukuras 側に `/search` ルートは存在しないため、受け皿は次の2つだけ:
 *   - 企業一覧 `/companies`（city / status / info / q / page を解釈する）
 *   - 工事カテゴリ `/works` および `/works/{slug}`
 * area と work_category の両方が指定された場合は、実際に絞り込みが効く
 * `/companies?city=` を優先する（`/works` 側は絞り込みパラメータを持たないため）。
 * tsukuras の next.config.ts は trailingSlash 未設定（既定 false）なので、
 * 末尾スラッシュ付き（`/works/`）はリダイレクトされる。正規形の `/works` を配る。
 */
function buildSearchUrl(area?: string, workCategory?: string): string {
  if (area) {
    const params = new URLSearchParams();
    params.set("city", area);
    params.set("utm_source", "mcp");
    return `https://tsukuras.jp/companies?${params.toString()}`;
  }

  if (workCategory) {
    const slug = workCategory.trim();
    // slug が取れないときだけカテゴリ一覧トップにフォールバックする。
    return slug
      ? `https://tsukuras.jp/works/${encodeURIComponent(slug)}?utm_source=mcp`
      : "https://tsukuras.jp/works?utm_source=mcp";
  }

  return "https://tsukuras.jp/companies?utm_source=mcp";
}
