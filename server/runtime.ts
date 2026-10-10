export interface RuntimeEnv {
  BANGUMI_USER_AGENT?: string;
  ANILIST_USER_AGENT?: string;
}

const defaults = {
  BANGUMI_USER_AGENT: "anime-radar/0.1.0 (personal project)",
  ANILIST_USER_AGENT: "anime-radar/0.1.0 (personal project)",
} as const;

let currentEnv: RuntimeEnv = {};

export function configureRuntimeEnv(env?: RuntimeEnv): void {
  if (!env) return;
  currentEnv = { ...env };
}

export function getRuntimeEnv(): Required<RuntimeEnv> {
  return {
    BANGUMI_USER_AGENT: currentEnv.BANGUMI_USER_AGENT ?? defaults.BANGUMI_USER_AGENT,
    ANILIST_USER_AGENT: currentEnv.ANILIST_USER_AGENT ?? defaults.ANILIST_USER_AGENT,
  };
}