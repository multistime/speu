/**
 * Спасылкі для хаба праекту (/admin/project). Частка бярэцца з env, каб стэйдж/кастомны домен былі актуальныя.
 */

export type ProjectHubLinkItem = {
  label: string;
  href: string;
  /** Кароткая падказка пад кнопкай */
  hint?: string;
};

export type ProjectHubLinks = {
  production: ProjectHubLinkItem;
  staging: ProjectHubLinkItem;
  /** Дадатковыя спасылкі — інструменты */
  tooling: ProjectHubLinkItem[];
  /** Асяроддзе бягучага дэплою (Vercel), калі вядома */
  deployEnv: "production" | "preview" | "development" | null;
  /** Публічны URL гэтага адкрыцця (карысна для «ты тут») */
  publicSiteOrigin: string | null;
};

const DEFAULT_PRODUCTION = "https://speu.vercel.app";
const VERCEL_PROJECT_PATH = "multistimes-projects/speu";
const GITHUB_REPO = "https://github.com/multistime/speu";

function trimUrl(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

function supabaseDashboardUrl(publicSupabaseUrl: string | undefined): string | null {
  const raw = trimUrl(publicSupabaseUrl);
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? `https://supabase.com/dashboard/project/${m[1]}` : null;
  } catch {
    return null;
  }
}

export function getProjectHubLinks(): ProjectHubLinks {
  const productionHref =
    trimUrl(process.env.NEXT_PUBLIC_SPEU_PRODUCTION_URL) ?? DEFAULT_PRODUCTION;

  const stagingExplicit = trimUrl(process.env.NEXT_PUBLIC_SPEU_STAGING_URL);
  const staging: ProjectHubLinkItem = stagingExplicit
    ? {
        label: "Стэйдж",
        href: stagingExplicit,
        hint: "NEXT_PUBLIC_SPEU_STAGING_URL",
      }
    : {
        label: "Preview / дэплої",
        href: `https://vercel.com/${VERCEL_PROJECT_PATH}/deployments`,
        hint: "Усе preview ў Vercel; або задайце NEXT_PUBLIC_SPEU_STAGING_URL",
      };

  const vercelProject = `https://vercel.com/${VERCEL_PROJECT_PATH}`;
  const supabaseDash = supabaseDashboardUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const tooling: ProjectHubLinkItem[] = [
    { label: "Vercel", href: vercelProject, hint: "Праект і дэплої" },
    { label: "GitHub", href: GITHUB_REPO, hint: "Рэпазіторый" },
  ];
  if (supabaseDash) {
    tooling.push({ label: "Supabase", href: supabaseDash, hint: "БД і auth" });
  }

  const vercelEnv = process.env.VERCEL_ENV as ProjectHubLinks["deployEnv"] | undefined;
  const deployEnv =
    vercelEnv === "production" || vercelEnv === "preview" || vercelEnv === "development"
      ? vercelEnv
      : null;

  const publicSiteOrigin = trimUrl(process.env.NEXT_PUBLIC_SITE_URL);

  return {
    production: {
      label: "Прадакшн",
      href: productionHref,
      hint: "NEXT_PUBLIC_SPEU_PRODUCTION_URL",
    },
    staging,
    tooling,
    deployEnv,
    publicSiteOrigin,
  };
}
