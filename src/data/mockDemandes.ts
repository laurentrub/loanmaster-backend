import { Demande } from "@/types/credit";

export const mockDemandes: Demande[] = [
  {
    id: "DEM-001",
    clientName: "Sophie Martin",
    email: "sophie.martin@email.com",
    phone: "06 12 34 56 78",
    amount: 50000,
    status: "pending",
    creditType: "immobilier",
    createdAt: "2025-01-10T10:30:00Z",
    updatedAt: "2025-01-10T10:30:00Z",
    reason: "Achat immobilier",
    duration: 240,
    internalNotes: "Client régulier, bon dossier",
    statusHistory: [
      { status: "pending", date: "2025-01-10T10:30:00Z", comment: "Demande reçue" }
    ],
  },
  {
    id: "DEM-002",
    clientName: "Thomas Dubois",
    email: "thomas.dubois@email.com",
    phone: "06 98 76 54 32",
    amount: 15000,
    status: "in_review",
    creditType: "travaux",
    createdAt: "2025-01-09T14:20:00Z",
    updatedAt: "2025-01-10T09:15:00Z",
    reason: "Travaux rénovation",
    duration: 60,
    internalNotes: "Vérifier les devis des travaux",
    statusHistory: [
      { status: "pending", date: "2025-01-09T14:20:00Z", comment: "Demande reçue" },
      { status: "in_review", date: "2025-01-10T09:15:00Z", comment: "Analyse en cours" }
    ],
  },
  {
    id: "DEM-003",
    clientName: "Marie Lefebvre",
    email: "marie.lefebvre@email.com",
    phone: "07 11 22 33 44",
    amount: 25000,
    status: "approved",
    creditType: "vehicule",
    createdAt: "2025-01-08T11:00:00Z",
    updatedAt: "2025-01-09T16:30:00Z",
    reason: "Achat véhicule",
    duration: 84,
    internalNotes: "Dossier complet, revenus stables",
    statusHistory: [
      { status: "pending", date: "2025-01-08T11:00:00Z", comment: "Demande reçue" },
      { status: "in_review", date: "2025-01-08T14:00:00Z", comment: "Analyse démarrée" },
      { status: "approved", date: "2025-01-09T16:30:00Z", comment: "Dossier approuvé" }
    ],
  },
  {
    id: "DEM-004",
    clientName: "Pierre Bernard",
    email: "pierre.bernard@email.com",
    phone: "06 55 44 33 22",
    amount: 8000,
    status: "rejected",
    creditType: "consommation",
    createdAt: "2025-01-07T09:45:00Z",
    updatedAt: "2025-01-08T14:20:00Z",
    reason: "Consolidation dettes",
    duration: 48,
    internalNotes: "Taux d'endettement trop élevé",
    statusHistory: [
      { status: "pending", date: "2025-01-07T09:45:00Z", comment: "Demande reçue" },
      { status: "in_review", date: "2025-01-07T15:00:00Z", comment: "Analyse en cours" },
      { status: "rejected", date: "2025-01-08T14:20:00Z", comment: "Refus pour taux d'endettement" }
    ],
  },
  {
    id: "DEM-005",
    clientName: "Julie Rousseau",
    email: "julie.rousseau@email.com",
    phone: "07 88 99 00 11",
    amount: 120000,
    status: "in_review",
    creditType: "immobilier",
    createdAt: "2025-01-06T13:15:00Z",
    updatedAt: "2025-01-10T08:00:00Z",
    reason: "Achat résidence principale",
    duration: 300,
    internalNotes: "Projet familial, à étudier en priorité",
    statusHistory: [
      { status: "pending", date: "2025-01-06T13:15:00Z", comment: "Demande reçue" },
      { status: "in_review", date: "2025-01-07T10:00:00Z", comment: "Dossier en analyse approfondie" }
    ],
  },
];
