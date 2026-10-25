/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do projeto Supabase (sem ela, a conta e a sincronização ficam escondidas). */
  readonly VITE_SUPABASE_URL?: string
  /** Chave publicável (sb_publishable_...) ou anon do Supabase: é pública, o acesso é pela RLS. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
