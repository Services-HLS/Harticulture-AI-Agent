ALTER TABLE public.training_documents 
ADD COLUMN target_role public.app_role;

-- Update existing records to have 'admin' as default (or NULL if you prefer)
UPDATE public.training_documents SET target_role = 'admin' WHERE target_role IS NULL;

-- Make it NOT NULL if desired, but NULL might mean 'global'
-- Let's keep it nullable to represent 'all roles' if we want, or add an ALL option to the enum.
-- Actually, the enum only has 'admin', 'district_officer', 'farmer'.
-- I'll keep it nullable for 'global' content.
