import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockDemandes } from "@/data/mockDemandes";
import { DemandeStatus } from "@/types/credit";
import { ArrowLeft, Mail, Phone, Calendar, Clock, Target, FileText } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<DemandeStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "En attente", variant: "secondary" },
  in_review: { label: "En cours", variant: "default" },
  approved: { label: "Approuvé", variant: "outline" },
  rejected: { label: "Refusé", variant: "destructive" },
};

const DemandeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const demande = mockDemandes.find(d => d.id === id);

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

  const handleApprove = () => {
    toast.success("Demande approuvée");
  };

  const handleReject = () => {
    toast.error("Demande refusée");
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
                  <p className="text-sm text-muted-foreground">Motif</p>
                  <p className="font-medium">{demande.reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Créée le</span>
              <span className="font-medium">{formatDate(demande.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Dernière mise à jour</span>
              <span className="font-medium">{formatDate(demande.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>

        {demande.status === "in_review" && (
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button onClick={handleApprove} className="flex-1">
                Approuver la demande
              </Button>
              <Button onClick={handleReject} variant="destructive" className="flex-1">
                Refuser la demande
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DemandeDetail;
