-- Cerulean initial schema with row-level security
-- Compatible with self-hosted Supabase on Railway

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX api_keys_user_id_idx ON public.api_keys(user_id);
CREATE INDEX api_keys_prefix_idx ON public.api_keys(key_prefix);

CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  background_knowledge_graph BOOLEAN NOT NULL DEFAULT TRUE,
  background_ranking BOOLEAN NOT NULL DEFAULT TRUE,
  background_suggestion BOOLEAN NOT NULL DEFAULT TRUE,
  background_tonal_adjustment BOOLEAN NOT NULL DEFAULT TRUE,
  custom_provider TEXT NOT NULL DEFAULT '',
  custom_model TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.workspace_roots (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  document_id UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conversations_user_id_idx ON public.conversations(user_id);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX messages_user_id_idx ON public.messages(user_id);

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX documents_user_id_idx ON public.documents(user_id);

CREATE TABLE public.document_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  block_type TEXT NOT NULL DEFAULT 'paragraph'
    CHECK (block_type IN ('heading', 'paragraph', 'bullet', 'section')),
  position DOUBLE PRECISION NOT NULL DEFAULT 0,
  linked_insights UUID[] NOT NULL DEFAULT '{}',
  source_messages UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX document_blocks_document_id_idx ON public.document_blocks(document_id);
CREATE INDEX document_blocks_user_id_idx ON public.document_blocks(user_id);

CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'captured'
    CHECK (status IN ('captured', 'discussing', 'resolved', 'promoted', 'archived')),
  priority INTEGER NOT NULL DEFAULT 0,
  relevance DOUBLE PRECISION NOT NULL DEFAULT 0,
  maturity DOUBLE PRECISION NOT NULL DEFAULT 0,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  source_message_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX insights_user_id_idx ON public.insights(user_id);

CREATE TABLE public.patches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  operations JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'reverted')),
  source_insight_id UUID REFERENCES public.insights(id) ON DELETE SET NULL,
  source_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX patches_user_id_idx ON public.patches(user_id);
CREATE INDEX patches_document_active_idx ON public.patches(document_id, is_active)
  WHERE is_active = TRUE AND status = 'pending';

CREATE TABLE public.graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL
    CHECK (node_type IN ('message', 'insight', 'document_block', 'topic')),
  entity_id UUID NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entity_id)
);

CREATE INDEX graph_nodes_user_id_idx ON public.graph_nodes(user_id);

CREATE TABLE public.graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL
    CHECK (relationship_type IN ('supports', 'contradicts', 'expands', 'references', 'derived_from')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source_node_id, target_node_id, relationship_type)
);

CREATE INDEX graph_edges_user_id_idx ON public.graph_edges(user_id);

CREATE TABLE public.document_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  markdown TEXT NOT NULL,
  source_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.generalized_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  markdown TEXT NOT NULL,
  source_document_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.exemplars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  markdown TEXT NOT NULL,
  user_notes TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_conversation_id UUID := gen_random_uuid();
  new_document_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);

  INSERT INTO public.conversations (id, user_id, title)
  VALUES (new_conversation_id, NEW.id, 'New Conversation');

  INSERT INTO public.documents (id, user_id, title)
  VALUES (new_document_id, NEW.id, 'Untitled Document');

  INSERT INTO public.workspace_roots (user_id, conversation_id, document_id)
  VALUES (NEW.id, new_conversation_id, new_document_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generalized_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemplars ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_own ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY api_keys_own ON public.api_keys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_settings_own ON public.user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY workspace_roots_own ON public.workspace_roots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY conversations_own ON public.conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY messages_own ON public.messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY documents_own ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY document_blocks_own ON public.document_blocks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY insights_own ON public.insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY patches_own ON public.patches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY graph_nodes_own ON public.graph_nodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY graph_edges_own ON public.graph_edges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY document_memories_own ON public.document_memories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY generalized_learnings_own ON public.generalized_learnings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY exemplars_own ON public.exemplars FOR ALL USING (auth.uid() = user_id);
