-- Username support for login (passwords stay in Supabase Auth — never store passwords here)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

-- Replace signup handler to copy username from auth metadata
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

  INSERT INTO public.documents (id, user_id, title)
  VALUES (new_document_id, NEW.id, 'Untitled Document');

  INSERT INTO public.workspace_roots (user_id, conversation_id, document_id)
  VALUES (NEW.id, new_conversation_id, new_document_id);

  RETURN NEW;
END;
$$;

-- Foreign keys for workspace integrity
ALTER TABLE public.workspace_roots
  DROP CONSTRAINT IF EXISTS workspace_roots_conversation_fkey;

ALTER TABLE public.workspace_roots
  ADD CONSTRAINT workspace_roots_conversation_fkey
  FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE public.workspace_roots
  DROP CONSTRAINT IF EXISTS workspace_roots_document_fkey;

ALTER TABLE public.workspace_roots
  ADD CONSTRAINT workspace_roots_document_fkey
  FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
