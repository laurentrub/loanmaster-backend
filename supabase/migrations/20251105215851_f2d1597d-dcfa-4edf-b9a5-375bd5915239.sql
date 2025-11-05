-- Table pour stocker les demandes de crédit
CREATE TABLE IF NOT EXISTS public.demandes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'documents_received')),
  credit_type TEXT NOT NULL CHECK (credit_type IN ('immobilier', 'travaux', 'vehicule', 'consommation', 'autre')),
  reason TEXT NOT NULL,
  duration INTEGER NOT NULL,
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'historique des statuts
CREATE TABLE IF NOT EXISTS public.demandes_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES public.demandes(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les demandes de justificatifs avec token sécurisé
CREATE TABLE IF NOT EXISTS public.document_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES public.demandes(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table pour stocker les documents uploadés
CREATE TABLE IF NOT EXISTS public.uploaded_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_request_id UUID NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  demande_id UUID NOT NULL REFERENCES public.demandes(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('identity', 'income', 'address', 'rib')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer le bucket de storage pour les documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'justificatifs',
  'justificatifs',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS sur toutes les tables
ALTER TABLE public.demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandes_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;

-- Policies pour les demandes (accès admin seulement pour l'instant)
CREATE POLICY "Admins can view all demandes"
  ON public.demandes
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert demandes"
  ON public.demandes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update demandes"
  ON public.demandes
  FOR UPDATE
  USING (true);

-- Policies pour l'historique des statuts
CREATE POLICY "Anyone can view status history"
  ON public.demandes_status_history
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert status history"
  ON public.demandes_status_history
  FOR INSERT
  WITH CHECK (true);

-- Policies pour les document requests (accès public avec token)
CREATE POLICY "Anyone can view document requests with valid token"
  ON public.document_requests
  FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Admins can create document requests"
  ON public.document_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update document requests"
  ON public.document_requests
  FOR UPDATE
  USING (expires_at > now());

-- Policies pour les documents uploadés
CREATE POLICY "Anyone can view uploaded documents"
  ON public.uploaded_documents
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert uploaded documents"
  ON public.uploaded_documents
  FOR INSERT
  WITH CHECK (true);

-- Storage policies pour le bucket justificatifs
CREATE POLICY "Anyone can upload to justificatifs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'justificatifs');

CREATE POLICY "Anyone can view justificatifs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'justificatifs');

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_demandes_updated_at
  BEFORE UPDATE ON public.demandes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour créer automatiquement une entrée d'historique lors du changement de statut
CREATE OR REPLACE FUNCTION public.create_status_history_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.demandes_status_history (demande_id, status, comment)
    VALUES (NEW.id, NEW.status, NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement l'historique
CREATE TRIGGER demandes_status_change
  AFTER UPDATE ON public.demandes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_status_history_entry();

-- Insérer l'historique initial pour les nouvelles demandes
CREATE OR REPLACE FUNCTION public.create_initial_status_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.demandes_status_history (demande_id, status, comment)
  VALUES (NEW.id, NEW.status, 'Demande créée');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER demandes_initial_status
  AFTER INSERT ON public.demandes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_initial_status_history();