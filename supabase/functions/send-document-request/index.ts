import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

    // Utiliser Resend avec clé fictive pour développement
    const resend = new Resend("re_fictive_key_for_development");
    
    try {
      await resend.emails.send({
        from: "CréditAdmin <onboarding@resend.dev>",
        to: [clientEmail],
        subject: "Finalisez votre demande de crédit",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Finalisez votre demande de crédit</h1>
                </div>
                <div class="content">
                  <p>Bonjour ${clientName},</p>
                  <p>Merci pour votre demande de crédit. Pour finaliser votre dossier, nous avons besoin de quelques justificatifs.</p>
                  <p>Veuillez cliquer sur le lien ci-dessous pour accéder à la page de dépôt sécurisée :</p>
                  <center>
                    <a href="${uploadUrl}" class="button">Déposer mes justificatifs</a>
                  </center>
                  <p><strong>Documents requis :</strong></p>
                  <ul>
                    <li>Pièce d'identité (recto-verso)</li>
                    <li>Justificatif de revenus (3 derniers bulletins de salaire)</li>
                    <li>Justificatif de domicile (moins de 3 mois)</li>
                    <li>Relevé d'identité bancaire (RIB)</li>
                  </ul>
                  <p><strong>Important :</strong> Ce lien expire dans 48 heures (${expiresAt.toLocaleString('fr-FR')}).</p>
                  <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email en toute sécurité.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} CréditAdmin - Tous droits réservés</p>
                </div>
              </div>
            </body>
          </html>
        `
      });
      console.log("Email sent successfully to:", clientEmail);
    } catch (emailError: any) {
      console.log("Email simulation (Resend avec clé fictive):", emailError.message);
      console.log("URL d'upload générée:", uploadUrl);
    }

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
