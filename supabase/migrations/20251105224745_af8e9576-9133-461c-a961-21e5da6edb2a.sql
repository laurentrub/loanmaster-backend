-- Créer les politiques RLS pour le bucket justificatifs
-- Permettre aux clients avec un token valide de créer des fichiers
CREATE POLICY "Clients can upload files with valid token"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'justificatifs' AND
  EXISTS (
    SELECT 1 FROM public.document_requests dr
    WHERE dr.token = (storage.foldername(name))[1]
    AND dr.expires_at > now()
  )
);

-- Permettre aux admins de voir tous les fichiers
CREATE POLICY "Admins can view all files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'justificatifs' AND
  true
);

-- Permettre aux clients de voir leurs propres fichiers uploadés
CREATE POLICY "Clients can view their uploaded files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'justificatifs' AND
  EXISTS (
    SELECT 1 FROM public.document_requests dr
    WHERE dr.token = (storage.foldername(name))[1]
    AND dr.expires_at > now()
  )
);