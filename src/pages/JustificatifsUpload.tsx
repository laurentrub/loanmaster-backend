import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle2, ShieldCheck, Clock } from "lucide-react";

type DocumentType = "identity" | "income" | "address" | "rib";

const documentLabels: Record<DocumentType, string> = {
  identity: "Justificatif d'identité",
  income: "Justificatif de revenus",
  address: "Justificatif de domicile",
  rib: "RIB",
};

const documentDescriptions: Record<DocumentType, string> = {
  identity: "Ce document nous permet de vérifier votre identité conformément à la réglementation bancaire.",
  income: "Ces pièces permettent d'évaluer votre capacité de remboursement.",
  address: "Ce document atteste de votre résidence en France.",
  rib: "Le RIB est nécessaire pour préparer le versement des fonds.",
};

const documentExamples: Record<DocumentType, string> = {
  identity: "CNI, Passeport ou Titre de séjour",
  income: "Bulletins de salaire ou avis d'imposition",
  address: "Facture d'électricité, quittance de loyer, etc.",
  rib: "Relevé d'identité bancaire",
};

const JustificatifsUpload = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [requestData, setRequestData] = useState<any>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Set<DocumentType>>(new Set());
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    checkTokenValidity();
  }, [token]);

  const checkTokenValidity = async () => {
    try {
      const { data, error } = await supabase
        .from("document_requests")
        .select("*, demandes(*)")
        .eq("token", token)
        .single();

      if (error || !data) {
        setIsValid(false);
        setLoading(false);
        return;
      }

      // Vérifier si le token a expiré
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      
      if (now > expiresAt || data.completed_at !== null) {
        setIsValid(false);
        setLoading(false);
        return;
      }

      setRequestData(data);
      setIsValid(true);
    } catch (error) {
      console.error("Error checking token:", error);
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (docType: DocumentType, file: File) => {
    if (!file || !requestData) return;

    setUploading(docType);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${requestData.demande_id}/${docType}_${Date.now()}.${fileExt}`;

      // Upload vers le bucket justificatifs
      const { error: uploadError } = await supabase.storage
        .from("justificatifs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Enregistrer dans la table uploaded_documents
      const { error: insertError } = await supabase
        .from("uploaded_documents")
        .insert({
          document_request_id: requestData.id,
          demande_id: requestData.demande_id,
          document_type: docType,
          file_path: fileName,
          file_name: file.name,
          file_size: file.size,
        });

      if (insertError) throw insertError;

      setUploadedDocs(prev => new Set(prev).add(docType));
      toast.success(`${documentLabels[docType]} téléversé avec succès`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Erreur lors du téléversement: ${error.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (uploadedDocs.size < 4) {
      toast.error("Veuillez téléverser tous les documents requis");
      return;
    }

    try {
      // Mettre à jour le statut de la demande de documents
      const { error: updateError } = await supabase
        .from("document_requests")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", requestData.id);

      if (updateError) throw updateError;

      // Mettre à jour le statut de la demande
      const { error: statusError } = await supabase
        .from("demandes")
        .update({ status: "in_review" })
        .eq("id", requestData.demande_id);

      if (statusError) throw statusError;

      setSubmitted(true);
      toast.success("Vos justificatifs ont bien été transmis");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error("Erreur lors de l'envoi");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Vérification...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lien expiré ou invalide
            </CardTitle>
            <CardDescription>
              Ce lien de dépôt de documents n'est plus valide. Il a peut-être expiré ou a déjà été utilisé.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Veuillez contacter notre service client pour obtenir un nouveau lien.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              Merci !
            </CardTitle>
            <CardDescription>
              Vos justificatifs ont bien été transmis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Nous avons bien reçu vos documents. Notre équipe va maintenant étudier votre dossier.
            </p>
            <p className="text-sm text-muted-foreground">
              Vous serez informé par email de l'avancement de votre demande.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Finalisez votre demande de crédit</h1>
          <p className="text-muted-foreground">
            Afin d'étudier votre dossier, merci de nous transmettre les pièces suivantes.
          </p>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            Ces documents sont strictement confidentiels et nécessaires pour vérifier votre identité et votre capacité financière.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {(Object.keys(documentLabels) as DocumentType[]).map((docType) => {
            const isUploaded = uploadedDocs.has(docType);
            const isCurrentlyUploading = uploading === docType;

            return (
              <Card key={docType} className={isUploaded ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{documentLabels[docType]}</span>
                    {isUploaded && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    <div className="space-y-1">
                      <p className="text-sm">{documentDescriptions[docType]}</p>
                      <p className="text-xs text-muted-foreground">
                        Exemples : {documentExamples[docType]}
                      </p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor={`file-${docType}`}>
                      {isUploaded ? "Document téléversé" : "Sélectionner le document"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`file-${docType}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={isUploaded || isCurrentlyUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType, file);
                        }}
                      />
                      {!isUploaded && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isCurrentlyUploading}
                          onClick={() => document.getElementById(`file-${docType}`)?.click()}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <Button
              onClick={handleSubmit}
              disabled={uploadedDocs.size < 4}
              className="w-full"
              size="lg"
            >
              Envoyer mes documents
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              En cliquant sur "Envoyer mes documents", vous confirmez l'exactitude des informations fournies.
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>Vos données sont transmises via une connexion sécurisée (SSL)</p>
          <p>et ne seront jamais partagées sans votre accord.</p>
        </div>
      </div>
    </div>
  );
};

export default JustificatifsUpload;
