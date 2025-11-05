import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockDemandes } from "@/data/mockDemandes";
import { DemandeStatus, CreditType } from "@/types/credit";
import { Eye, TrendingUp, Clock, CheckCircle, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

const statusConfig: Record<DemandeStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "En attente", variant: "secondary" },
  in_review: { label: "En cours", variant: "default" },
  approved: { label: "Approuvé", variant: "outline" },
  rejected: { label: "Refusé", variant: "destructive" },
};

const creditTypeConfig: Record<CreditType, string> = {
  immobilier: "Immobilier",
  travaux: "Travaux",
  vehicule: "Véhicule",
  consommation: "Consommation",
  autre: "Autre",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [creditTypeFilter, setCreditTypeFilter] = useState<string>("all");

  const filteredDemandes = useMemo(() => {
    return mockDemandes.filter((demande) => {
      const matchesSearch = 
        demande.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        demande.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || demande.status === statusFilter;
      const matchesCreditType = creditTypeFilter === "all" || demande.creditType === creditTypeFilter;
      
      return matchesSearch && matchesStatus && matchesCreditType;
    });
  }, [searchQuery, statusFilter, creditTypeFilter]);

  const stats = {
    total: mockDemandes.length,
    pending: mockDemandes.filter(d => d.status === "pending").length,
    inReview: mockDemandes.filter(d => d.status === "in_review").length,
    approved: mockDemandes.filter(d => d.status === "approved").length,
  };

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
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Vue d'ensemble des demandes de crédit</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total demandes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inReview}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>Demandes récentes</CardTitle>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative flex-1 md:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou N°..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[160px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_review">En cours</SelectItem>
                    <SelectItem value="approved">Approuvées</SelectItem>
                    <SelectItem value="rejected">Refusées</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={creditTypeFilter} onValueChange={setCreditTypeFilter}>
                  <SelectTrigger className="w-full md:w-[160px]">
                    <SelectValue placeholder="Type crédit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="immobilier">Immobilier</SelectItem>
                    <SelectItem value="travaux">Travaux</SelectItem>
                    <SelectItem value="vehicule">Véhicule</SelectItem>
                    <SelectItem value="consommation">Consommation</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDemandes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune demande ne correspond aux filtres sélectionnés
                </div>
              ) : (
                filteredDemandes.map((demande) => (
                <div
                  key={demande.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{demande.clientName}</p>
                      <Badge variant={statusConfig[demande.status].variant}>
                        {statusConfig[demande.status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{demande.id}</span>
                      <span>•</span>
                      <span>{creditTypeConfig[demande.creditType]}</span>
                      <span>•</span>
                      <span>{formatAmount(demande.amount)}</span>
                      <span>•</span>
                      <span>{formatDate(demande.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/demande/${demande.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
