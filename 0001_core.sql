CREATE TABLE IF NOT EXISTS app_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('creator','brand','admin')),
  display_name TEXT NOT NULL DEFAULT '',
  headline TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  organization TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  avatar_key TEXT NOT NULL DEFAULT '',
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  formats JSONB NOT NULL DEFAULT '[]'::jsonb,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  availability TEXT NOT NULL DEFAULT 'open',
  commercial_use_declared BOOLEAN NOT NULL DEFAULT false,
  price_min NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_max NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  public_profile BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_profiles_role_idx ON app_profiles(role);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id BIGSERIAL PRIMARY KEY,
  creator_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  media_url TEXT NOT NULL DEFAULT '',
  media_key TEXT NOT NULL DEFAULT '',
  media_type TEXT NOT NULL DEFAULT 'image',
  content_type TEXT NOT NULL DEFAULT 'AI filmmaking',
  visual_style TEXT NOT NULL DEFAULT '',
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  workflow JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  formats JSONB NOT NULL DEFAULT '[]'::jsonb,
  rights_status TEXT NOT NULL DEFAULT 'self-reported',
  license_notes TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_creator_idx ON portfolio_items(creator_user_id);
CREATE INDEX IF NOT EXISTS portfolio_type_idx ON portfolio_items(content_type);

CREATE TABLE IF NOT EXISTS briefs (
  id BIGSERIAL PRIMARY KEY,
  brand_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  visual_style TEXT NOT NULL DEFAULT '',
  reference_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  formats JSONB NOT NULL DEFAULT '[]'::jsonb,
  aspect_ratios JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration TEXT NOT NULL DEFAULT '',
  resolution TEXT NOT NULL DEFAULT '',
  budget_min NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_max NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  deadline DATE,
  commercial_use BOOLEAN NOT NULL DEFAULT false,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  territories TEXT NOT NULL DEFAULT '',
  usage_duration TEXT NOT NULL DEFAULT '',
  exclusivity TEXT NOT NULL DEFAULT '',
  licensing_requirements TEXT NOT NULL DEFAULT '',
  extra_instructions TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS briefs_brand_idx ON briefs(brand_user_id);
CREATE INDEX IF NOT EXISTS briefs_status_deadline_idx ON briefs(status, deadline);

CREATE TABLE IF NOT EXISTS shortlists (
  id BIGSERIAL PRIMARY KEY,
  brand_user_id TEXT NOT NULL,
  creator_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_user_id, creator_user_id)
);

CREATE TABLE IF NOT EXISTS proposals (
  id BIGSERIAL PRIMARY KEY,
  brief_id BIGINT NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  creator_user_id TEXT NOT NULL,
  cover_letter TEXT NOT NULL,
  proposed_price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  delivery_days INTEGER NOT NULL,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','accepted','declined','withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS active_proposal_unique_idx ON proposals(brief_id, creator_user_id) WHERE status IN ('submitted','accepted');
CREATE INDEX IF NOT EXISTS proposals_brief_idx ON proposals(brief_id, status);

CREATE TABLE IF NOT EXISTS engagements (
  id BIGSERIAL PRIMARY KEY,
  brief_id BIGINT NOT NULL REFERENCES briefs(id),
  proposal_id BIGINT NOT NULL UNIQUE REFERENCES proposals(id),
  brand_user_id TEXT NOT NULL,
  creator_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','in_review','revision_requested','approved','cancelled')),
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS engagements_brand_idx ON engagements(brand_user_id, status);
CREATE INDEX IF NOT EXISTS engagements_creator_idx ON engagements(creator_user_id, status);

CREATE TABLE IF NOT EXISTS deliverables (
  id BIGSERIAL PRIMARY KEY,
  engagement_id BIGINT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  creator_user_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  file_key TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','revision_requested','approved')),
  brand_feedback TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, version)
);
CREATE INDEX IF NOT EXISTS deliverables_engagement_idx ON deliverables(engagement_id, version DESC);

CREATE TABLE IF NOT EXISTS verification_records (
  id BIGSERIAL PRIMARY KEY,
  creator_user_id TEXT NOT NULL,
  portfolio_item_id BIGINT REFERENCES portfolio_items(id) ON DELETE CASCADE,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('tool','workflow','past_work')),
  claim TEXT NOT NULL,
  evidence_url TEXT NOT NULL DEFAULT '',
  evidence_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'evidence_submitted' CHECK (status IN ('self_reported','evidence_submitted','verified','rejected')),
  reviewer_user_id TEXT,
  review_notes TEXT NOT NULL DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verification_creator_idx ON verification_records(creator_user_id, status);

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_events(entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS brief_ai_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  usage_day DATE NOT NULL DEFAULT CURRENT_DATE,
  requests INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, usage_day)
);