-- ================================================
--  Apollo CRM – Schema completo
--  Rodar no Supabase: SQL Editor → New query → Run
-- ================================================

-- Cidades
CREATE TABLE IF NOT EXISTS cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  state       TEXT NOT NULL,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Empresas
CREATE TABLE IF NOT EXISTS companies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  cnpj           TEXT,
  segment        TEXT,
  website        TEXT,
  city           TEXT,
  state          TEXT,
  employees      INTEGER,
  annual_revenue TEXT,
  status         TEXT DEFAULT 'prospect' CHECK (status IN ('active','inactive','prospect')),
  temperature    TEXT DEFAULT 'cold'    CHECK (temperature IN ('hot','warm','cold')),
  tags           TEXT[] DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Pessoas
CREATE TABLE IF NOT EXISTS people (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  role         TEXT,
  company_id   UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,
  city         TEXT,
  state        TEXT,
  tags         TEXT[] DEFAULT '{}',
  status       TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  priority     TEXT DEFAULT 'normal'  CHECK (priority IN ('low','normal','high','critical')),
  due_date     DATE,
  person_id    UUID REFERENCES people(id) ON DELETE SET NULL,
  person_name  TEXT,
  company_id   UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Funis (stages e cards em JSONB para flexibilidade)
CREATE TABLE IF NOT EXISTS funnels (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  stages     JSONB DEFAULT '[]',
  cards      JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sequências
CREATE TABLE IF NOT EXISTS sequences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  active      BOOLEAN DEFAULT false,
  steps       JSONB DEFAULT '[]',
  contact_ids UUID[] DEFAULT '{}',
  company_ids UUID[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Conversas WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      TEXT,
  contact_name    TEXT NOT NULL,
  contact_phone   TEXT NOT NULL,
  last_message    TEXT DEFAULT '',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread          INTEGER DEFAULT 0,
  messages        JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Desabilitar RLS (sem autenticação por enquanto)
ALTER TABLE cities                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies               DISABLE ROW LEVEL SECURITY;
ALTER TABLE people                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE funnels                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE sequences               DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations  DISABLE ROW LEVEL SECURITY;
