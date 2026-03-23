-- ================================================
--  Pipa CRM – Migração v2
--  Rodar no Supabase: SQL Editor → New query → Run
-- ================================================

-- Growth Lab
CREATE TABLE IF NOT EXISTS growth_weeks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  north_star  TEXT,
  ns_current  NUMERIC DEFAULT 0,
  ns_target   NUMERIC DEFAULT 0,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS growth_experiments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id     UUID REFERENCES growth_weeks(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  hypothesis  TEXT,
  category    TEXT DEFAULT 'Acquisition',
  status      TEXT DEFAULT 'backlog',
  impact      INTEGER DEFAULT 5,
  confidence  INTEGER DEFAULT 5,
  ease        INTEGER DEFAULT 5,
  result      TEXT,
  learnings   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Funnel transitions (automação entre funis)
CREATE TABLE IF NOT EXISTS funnel_transitions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label            TEXT,
  source_funnel_id UUID,
  source_stage_id  UUID,
  target_funnel_id UUID,
  target_stage_id  UUID,
  active           BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Agentes de IA
CREATE TABLE IF NOT EXISTS agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  role          TEXT DEFAULT '',
  system_prompt TEXT DEFAULT '',
  model         TEXT DEFAULT 'gemini',
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Metas / Sprint ──────────────────────────────────────────────

-- Configuração do sprint ativo
CREATE TABLE IF NOT EXISTS sprint_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  revenue_goal        NUMERIC DEFAULT 50000,
  avg_ticket          NUMERIC DEFAULT 5000,
  rate_reun_to_sale   NUMERIC DEFAULT 30,
  rate_prosp_to_reun  NUMERIC DEFAULT 15,
  target_companies    INTEGER DEFAULT 200,
  active              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Etapas do funil de conversão (histórico mutável)
CREATE TABLE IF NOT EXISTS funnel_conversion_stages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  current_rate NUMERIC DEFAULT 0,
  target_rate  NUMERIC DEFAULT 50,
  avg_days     INTEGER DEFAULT 3,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Log diário de atividades
CREATE TABLE IF NOT EXISTS daily_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date    DATE NOT NULL UNIQUE,
  prospected  INTEGER DEFAULT 0,
  meetings    INTEGER DEFAULT 0,
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Progresso do sprint
CREATE TABLE IF NOT EXISTS sprint_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id        UUID REFERENCES sprint_config(id) ON DELETE CASCADE,
  revenue_closed   NUMERIC DEFAULT 0,
  forecast_value   NUMERIC DEFAULT 0,
  prospected_total INTEGER DEFAULT 0,
  reunioes_total   INTEGER DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Desabilitar RLS
ALTER TABLE growth_weeks              DISABLE ROW LEVEL SECURITY;
ALTER TABLE growth_experiments        DISABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_transitions        DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_config             DISABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_conversion_stages  DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs                DISABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_progress           DISABLE ROW LEVEL SECURITY;

-- Adicionar coluna model em agents (caso a tabela já exista sem ela)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'gemini';
