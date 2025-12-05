import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  File, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UploadedDocument {
  id: string;
  document_request_id: string;
  demande_id: string;
  file_size: number;
  uploaded_at: string;
  document_type: string;
  file_name: string;
  file_path: string;
  demandes: {
    client_name: string;
  } | null;
}

const documentTypeLabels: Record<string, string> = {
  identity: "Pièce d'identité",
  income: "Justificatif de revenus",
  address: "Justificatif de domicile",
  bank: "RIB",
};

const documentTypeColors: Record<string, string> = {
  identity: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  income: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  address: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  bank: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const isImageFile = (fileName: string): boolean => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
};

const isPdfFile = (fileName: string): boolean => {
  return fileName.toLowerCase().endsWith(".pdf");
};

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["uploaded-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("uploaded_documents")
        .select("*, demandes(client_name)")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data as UploadedDocument[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (document: UploadedDocument) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("justificatifs")
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("uploaded_documents")
        .delete()
        .eq("id", document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploaded-documents"] });
      toast.success("Document supprimé avec succès");
    },
    onError: (error) => {
      console.error("Error deleting document:", error);
      toast.error("Erreur lors de la suppression du document");
    },
  });

  const handlePreview = async (document: UploadedDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("justificatifs")
        .createSignedUrl(document.file_path, 3600);

      if (error) throw error;

      setPreviewFileName(document.file_name);
      
      if (isImageFile(document.file_name)) {
        setPreviewType("image");
        setPreviewUrl(data.signedUrl);
      } else if (isPdfFile(document.file_name)) {
        setPreviewType("pdf");
        setPreviewUrl(data.signedUrl);
      } else {
        toast.error("Prévisualisation non disponible pour ce type de fichier");
      }
    } catch (error) {
      console.error("Error getting preview URL:", error);
      toast.error("Erreur lors de la prévisualisation");
    }
  };

  const handleDownload = async (document: UploadedDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("justificatifs")
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Téléchargement démarré");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const filteredDocuments = documents?.filter(
    (doc) =>
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      documentTypeLabels[doc.document_type]
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      doc.demandes?.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground mt-2">
              Gestion des justificatifs uploadés par les clients
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documents récents</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDocuments && filteredDocuments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du fichier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Date d'upload</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isImageFile(doc.file_name) ? (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          ) : isPdfFile(doc.file_name) ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <File className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium truncate max-w-[200px]">
                            {doc.file_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={documentTypeColors[doc.document_type] || ""}
                        >
                          {documentTypeLabels[doc.document_type] || doc.document_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/demande/${doc.demande_id}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <span className="truncate max-w-[150px]">
                            {doc.demandes?.client_name || "Client inconnu"}
                          </span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(doc.uploaded_at), "dd MMM yyyy à HH:mm", {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {(isImageFile(doc.file_name) || isPdfFile(doc.file_name)) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePreview(doc)}
                              title="Prévisualiser"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(doc)}
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirmer la suppression
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer le document "
                                  {doc.file_name}" ? Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(doc)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun document trouvé</p>
                <p className="text-sm mt-2">
                  Les documents uploadés par les clients apparaîtront ici
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFileName}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {previewType === "image" && previewUrl && (
              <img
                src={previewUrl}
                alt={previewFileName}
                className="w-full h-auto rounded-lg"
              />
            )}
            {previewType === "pdf" && previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh] rounded-lg"
                title={previewFileName}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Documents;
