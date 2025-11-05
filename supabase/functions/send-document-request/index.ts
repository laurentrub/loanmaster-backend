import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { demandeId, clientName, clientEmail } = await req.json();

    console.log("Sending document request email to:", clientEmail, "for demande:", demandeId);

    // Créer une demande de documents avec token unique
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // Valable 48h

    const { error: insertError } = await supabase
      .from("document_requests")
      .insert({
        demande_id: demandeId,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error creating document request:", insertError);
      throw insertError;
    }

    // Construire l'URL de la page de dépôt
    const uploadUrl = `${req.headers.get('origin') || supabaseUrl}/justificatifs/${token}`;

    // Simuler l'envoi d'email (en développement avec clé fictive)
    console.log("===== EMAIL SIMULATION =====");
    console.log("From: CréditAdmin <onboarding@resend.dev>");
    console.log("To:", clientEmail);
    console.log("Subject: Finalisez votre demande de crédit");
    console.log("Upload URL:", uploadUrl);
    console.log("Token expires:", expiresAt);
    console.log("===========================");

    // En production, vous utiliseriez Resend comme ceci:
    // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    // await resend.emails.send({
    //   from: "CréditAdmin <onboarding@resend.dev>",
    //   to: [clientEmail],
    //   subject: "Finalisez votre demande de crédit",
    //   html: `...`
    // });

    return new Response(
      JSON.stringify({ success: true, token, uploadUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-document-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
