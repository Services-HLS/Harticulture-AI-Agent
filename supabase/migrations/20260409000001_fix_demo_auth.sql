-- Fix for Demo Login: Allow non-UUID IDs and relax RLS for Demo users

-- 1. Modify training_documents table to allow TEXT for uploaded_by
ALTER TABLE public.training_documents ALTER COLUMN uploaded_by TYPE TEXT;

-- 2. Modify chat_history table to allow TEXT for user_id
ALTER TABLE public.chat_history ALTER COLUMN user_id TYPE TEXT;

-- 3. Modify profiles table to allow TEXT for user_id
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;

-- 4. Update the has_role function to handle demo roles stored in localStorage or passed via context
-- Since we can't easily check localStorage from SQL, we'll allow any user with 'demo-' prefix 
-- who claims to be an admin to pass the role check for these specific tables in this dev/demo environment.

CREATE OR REPLACE FUNCTION public.is_admin(_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If it's a real UUID, check user_roles
  IF _user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id::text = _user_id AND role = 'admin'
    );
  END IF;
  
  -- If it's a demo admin ID
  IF _user_id = 'demo-admin' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 5. Relax RLS policies to allow anon/demo access for these specific operations
-- (Only recommended for this specific PoC/Demo environment)

DROP POLICY IF EXISTS "Admins can manage training docs" ON public.training_documents;
CREATE POLICY "Admins can manage training docs"
ON public.training_documents FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Admins can manage embeddings" ON public.document_embeddings;
CREATE POLICY "Admins can manage embeddings"
ON public.document_embeddings FOR ALL
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') OR auth.role() = 'anon');

-- Also allow anonymous users (demo) to insert
ALTER POLICY "All users can read training docs" ON public.training_documents 
USING (true);

-- Allow anonymous storage access for the demo bucket
DROP POLICY IF EXISTS "Admins can upload training docs" ON storage.objects;
CREATE POLICY "Anyone can upload training docs in demo"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'training-documents');

DROP POLICY IF EXISTS "Admins can view training docs" ON storage.objects;
CREATE POLICY "Anyone can view training docs in demo"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'training-documents');
