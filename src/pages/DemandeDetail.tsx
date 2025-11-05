import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockDemandes } from "@/data/mockDemandes";
import { DemandeStatus } from "@/types/credit";
import { ArrowLeft, Mail, Phone, Calendar, Clock, Target, FileText, Save, FileCheck, FileSignature, RefreshCw, History } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<DemandeStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "En attente", variant: "secondary" },
  in_review: { label: "En cours", variant: "default" },
  approved: { label: "Approuvé", variant: "outline" },
  rejected: { label: "Refusé", variant: "destructive" },
};

const creditTypeLabels = {
  immobilier: "Immobilier",
  travaux: "Travaux",
  vehicule: "Véhicule",
  consommation: "Consommation",
  autre: "Autre"
};

const DemandeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const demande = mockDemandes.find(d => d.id === id);
  const [notes, setNotes] = useState(demande?.internalNotes || "");
  const [newStatus, setNewStatus] = useState<DemandeStatus | "">("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!demande) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Demande non trouvée</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Retour au dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveNotes = () => {
    toast.success("Notes internes enregistrées");
  };

  const handleRequestDocuments = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("send-document-request", {
        body: {
          demandeId: demande.id,
          clientName: demande.clientName,
          clientEmail: demande.email,
        },
      });

      if (error) throw error;
      
      toast.success("Email de demande de justificatifs envoyé au client");
    } catch (error: any) {
      console.error("Error sending document request:", error);
      toast.error("Erreur lors de l'envoi de l'email");
    }
  };

  const handleGenerateContract = () => {
    toast.success("Contrat généré avec succès");
  };

  const handleChangeStatus = () => {
    if (!newStatus) {
      toast.error("Veuillez sélectionner un statut");
      return;
    }
    toast.success(`Statut changé en ${statusConfig[newStatus].label}`);
    setIsDialogOpen(false);
    setNewStatus("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{demande.clientName}</h1>
            <p className="text-muted-foreground mt-2">Demande {demande.id}</p>
          </div>
          <Badge variant={statusConfig[demande.status].variant} className="text-base px-4 py-2">
            {statusConfig[demande.status].label}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{demande.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{demande.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails de la demande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Montant demandé</p>
                  <p className="font-medium text-lg">{formatAmount(demande.amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Durée</p>
                  <p className="font-medium">{demande.duration} mois</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Type de crédit</p>
                  <p className="font-medium">{creditTypeLabels[demande.creditType]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Motif</p>
                  <p className="font-medium">{demande.reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des statuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demande.statusHistory.map((entry, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`h-2 w-2 rounded-full ${
                      index === 0 ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                    {index < demande.statusHistory.length - 1 && (
                      <div className="w-px h-12 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusConfig[entry.status].variant}>
                        {statusConfig[entry.status].label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    {entry.comment && (
                      <p className="text-sm text-muted-foreground">{entry.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Notes internes</CardTitle>
            <Button size="sm" onClick={handleSaveNotes}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Ajoutez des notes internes visibles uniquement par les administrateurs..."
              className="min-h-[120px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={handleRequestDocuments} variant="outline">
              <FileCheck className="h-4 w-4 mr-2" />
              Demander justificatifs
            </Button>
            <Button onClick={handleGenerateContract} variant="outline">
              <FileSignature className="h-4 w-4 mr-2" />
              Générer contrat
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Changer statut
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Changer le statut de la demande</DialogTitle>
                  <DialogDescription>
                    Sélectionnez le nouveau statut pour la demande {demande.id}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nouveau statut</label>
                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as DemandeStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="in_review">En cours</SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                        <SelectItem value="rejected">Refusé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleChangeStatus}>
                    Confirmer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DemandeDetail;
