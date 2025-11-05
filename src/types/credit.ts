export type DemandeStatus = "pending" | "in_review" | "approved" | "rejected";
export type CreditType = "immobilier" | "travaux" | "vehicule" | "consommation" | "autre";

export interface StatusHistory {
  status: DemandeStatus;
  date: string;
  comment?: string;
}

export interface Demande {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  amount: number;
  status: DemandeStatus;
  creditType: CreditType;
  createdAt: string;
  updatedAt: string;
  reason: string;
  duration: number; // en mois
  internalNotes?: string;
  statusHistory: StatusHistory[];
}
