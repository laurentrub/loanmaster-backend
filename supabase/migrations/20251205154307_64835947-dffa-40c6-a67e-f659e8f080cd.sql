-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Admins can view document requests" ON public.document_requests;
DROP POLICY IF EXISTS "Admins can insert document requests" ON public.document_requests;
DROP POLICY IF EXISTS "Admins can update document requests" ON public.document_requests;

-- Create admin-only policies
CREATE POLICY "Admins can view document requests" 
ON public.document_requests 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert document requests" 
ON public.document_requests 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update document requests" 
ON public.document_requests 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create secure RPC function to get document request by exact token
CREATE OR REPLACE FUNCTION public.get_document_request_by_token(request_token text)
RETURNS TABLE (
  id uuid,
  demande_id uuid,
  token text,
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, demande_id, token, expires_at, completed_at, created_at
  FROM public.document_requests
  WHERE token = request_token
    AND expires_at > now()
    AND completed_at IS NULL
  LIMIT 1;
$$;

-- Create secure RPC function to complete a document request by token
CREATE OR REPLACE FUNCTION public.complete_document_request(request_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_demande_id uuid;
BEGIN
  SELECT demande_id INTO v_demande_id
  FROM public.document_requests
  WHERE token = request_token
    AND expires_at > now()
    AND completed_at IS NULL;
  
  IF v_demande_id IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE public.document_requests
  SET completed_at = now()
  WHERE token = request_token;
  
  UPDATE public.demandes
  SET status = 'in_review'
  WHERE id = v_demande_id;
  
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_document_request_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_document_request(text) TO anon, authenticated;