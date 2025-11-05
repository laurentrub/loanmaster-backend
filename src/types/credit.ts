export type DemandeStatus = "pending" | "in_review" | "approved" | "rejected";

export interface Demande {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  amount: number;
  status: DemandeStatus;
  createdAt: string;
  updatedAt: string;
  reason: string;
  duration: number; // en mois
}
