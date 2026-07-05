-- Document templates + patch placement metadata

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'product_spec'
    CHECK (document_type IN ('blank', 'product_spec', 'strategy_memo', 'product_analysis'));

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS template_version SMALLINT NOT NULL DEFAULT 1;

ALTER TABLE public.patches
  ADD COLUMN IF NOT EXISTS placement_label TEXT,
  ADD COLUMN IF NOT EXISTS placement_block_id UUID;

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS suggest_insights BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS advanced_mode BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_chosen_template BOOLEAN NOT NULL DEFAULT FALSE;

-- New users get Product Spec document title (blocks seeded on first app load)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_conversation_id UUID := gen_random_uuid();
  new_document_id UUID := gen_random_uuid();
  meta_username TEXT := NEW.raw_user_meta_data->>'username';
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, meta_username);

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);

  INSERT INTO public.conversations (id, user_id, title)
  VALUES (new_conversation_id, NEW.id, 'New Conversation');

  INSERT INTO public.documents (id, user_id, title, document_type)
  VALUES (new_document_id, NEW.id, 'Product Spec', 'product_spec');

  INSERT INTO public.workspace_roots (user_id, conversation_id, document_id)
  VALUES (NEW.id, new_conversation_id, new_document_id);

  RETURN NEW;
END;
$$;
