-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing document embeddings
CREATE TABLE public.document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.training_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  target_role app_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- Admins can manage embeddings
CREATE POLICY "Admins can manage embeddings"
ON public.document_embeddings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read embeddings for querying
CREATE POLICY "Users can read embeddings"
ON public.document_embeddings FOR SELECT
TO authenticated
USING (true);

-- Function to match documents based on embedding similarity
CREATE OR REPLACE FUNCTION public.match_documents (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  filter_role app_role
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  target_role app_role,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.content,
    document_embeddings.target_role,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity
  FROM document_embeddings
  WHERE (document_embeddings.target_role = filter_role OR document_embeddings.target_role IS NULL)
    AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
