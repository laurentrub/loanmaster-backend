-- Fix demandes table RLS policies to require admin authentication
DROP POLICY IF EXISTS "Admins can view all demandes" ON public.demandes;
DROP POLICY IF EXISTS "Admins can insert demandes" ON public.demandes;
DROP POLICY IF EXISTS "Admins can update demandes" ON public.demandes;

-- Create new policies that require authenticated admin role
CREATE POLICY "Admins can view all demandes" 
ON public.demandes 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert demandes" 
ON public.demandes 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update demandes" 
ON public.demandes 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix demandes_status_history table RLS policies
DROP POLICY IF EXISTS "Anyone can view status history" ON public.demandes_status_history;
DROP POLICY IF EXISTS "Anyone can insert status history" ON public.demandes_status_history;

CREATE POLICY "Admins can view status history" 
ON public.demandes_status_history 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert status history" 
ON public.demandes_status_history 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix uploaded_documents table RLS policies
DROP POLICY IF EXISTS "Anyone can view uploaded documents" ON public.uploaded_documents;
DROP POLICY IF EXISTS "Anyone can insert uploaded documents" ON public.uploaded_documents;

CREATE POLICY "Admins can view uploaded documents" 
ON public.uploaded_documents 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow insert for clients with valid document request token (public access needed for external uploads)
CREATE POLICY "Clients can insert with valid token" 
ON public.uploaded_documents 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.document_requests dr 
    WHERE dr.id = document_request_id 
    AND dr.expires_at > now() 
    AND dr.completed_at IS NULL
  )
);